class MainApp extends CustomElement {
	constructor() {
		super();
		window.app = this;

		// Auth from URL
		authFromURL();

		// Wait for DOM to be ready
		this.whenReady(async () => {
			// // Log every storage change
			// STORAGE.onChange(console.log);

			// Set the inner HTML
			this.innerHTML = html`
				<menu-page />
				<calendar-page />
				<analysis-page />
				<div id="mobile-only-cover">
					<span class="icon">menstrual_health</span>
					<span class="text">Cette application n'est pas optimisée pour ordinateurs. Utilisez-la sur votre téléphone ou réduisez la largeur de votre navigateur pour une meilleure expérience.</span>
				</div>
			`;

			// Show the menu page if not signed in
			body_class.toggle('menu', !userSignedIn());

			// Wait for calendar page to be ready
			this.$('calendar-page').addEventListener('ready', () => this.analyzeData());
		});
	}

	// Get the data from a month
	async getMonthData(year, month) {
		// Get the data from the storage
		const data = await STORAGE.read(`${year}-${month}.json`);
		if (!data) return {};

		// Return the data
		return data;
	}

	// Save the data for a month
	async saveMonthData(year, month, data) {
		// Save the data to the storage
		await STORAGE.write(`${year}-${month}.json`, data);
	}

	// Analyze the data using AI
	async analyzeData() {
		// -------- Data recap --------

		// Analyze button
		const analysis_button = this.$('#analysis.icon');

		// Entries array
		const entries = [];

		// For each calendar month data
		for (const { data } of $$('calendar-month')) {
			// For each entry in the month data
			for (const key in data) entries.push(data[key]);
		}

		// If no entries, return null
		if (entries.length === 0) {
			analysis_button.classList.remove('color-spin');
			analysis_button.removeAttribute('style');

			$('analysis-page #analysis-clock .clock-content').innerHTML = html`
				<div class="clock-content">
					<span class="clock-day-text">Jour du cycle</span>
					<span class="clock-day-val">0</span>
					<span class="clock-period">Aucune donnée</span>
				</div>
			`;

			$('analysis-page #analysis-phase-container').remove();
			$('analysis-page #cycle-analysis-container').remove();
			$('analysis-page .analysis-info').innerText = "Veuillez saisir les jours de vos règles dans le calendrier pour que l'analyse puisse être effectuée.";

			return;
		}

		// Sort entries by date
		entries.sort((a, b) => new Date(a.date) - new Date(b.date));

		let recap = '';
		let last_entry = null;
		let last_cycle_first_entry = null;
		let period_durations = [];
		let duration_days_count = 0;
		let number_of_days_between_cycles = [];
		let days_since_last_cycle_first_entry = 0;

		for (const entry of entries) {
			// Increment the days count
			duration_days_count++;

			// Get the number of days since the last entry
			const days_since_last_entry = last_entry ? (new Date(entry.date) - new Date(last_entry.date)) / (24 * 60 * 60 * 1000) : 0;

			// Check if the last date is more than a week ago
			if (days_since_last_entry > 7) {
				// get the days since the last cycle first entry
				days_since_last_cycle_first_entry = (new Date(entry.date) - new Date(last_cycle_first_entry.date)) / (24 * 60 * 60 * 1000);

				// Add days since last cycle first entry to the recap
				// recap += `Règles pendant ${duration_days_count - 1} jours (${last_cycle_first_entry.date} - ${last_entry.date})\n`;
				recap += `Règles pendant ${duration_days_count - 1} jours\n`;
				period_durations.push(duration_days_count - 1);
				recap += `\n${days_since_last_cycle_first_entry} jours après le début des règles précédentes :\n`;

				// Set the last cycle first entry to the current entry
				last_cycle_first_entry = entry;

				// Reset the duration days count
				duration_days_count = 1;

				// Add the number of days between cycles
				number_of_days_between_cycles.push(days_since_last_cycle_first_entry);
			}

			// Add the entry to the recap
			recap += `${entry.date};${entry.flow};${entry.pain}\n`;

			// Update the last date
			last_entry = entry;

			// Set the first entry of the last cycle
			if (!last_cycle_first_entry) last_cycle_first_entry = entry;
		}

		// Add the last cycle recap
		// recap += `Règles pendant ${duration_days_count} jours (${last_cycle_first_entry.date} - ${last_entry.date})\n`;
		recap += `Règles pendant ${duration_days_count} jours\n`;
		period_durations.push(duration_days_count);
		recap += `\n------\n`;

		// Calculate the average and standard deviation of a given array
		const average = arr => arr.reduce((a, b) => a + b, 0) / arr.length || 0;
		const stddev = arr => {
			const avg = average(arr);
			return Math.sqrt(arr.reduce((acc, val) => acc + Math.pow(val - avg, 2), 0) / arr.length) || 0;
		};

		// Copy the number of days between cycles to a new array
		const number_of_days_between_cycles_copy = [...number_of_days_between_cycles];

		// Check the evolution of the average duration of cycles by removing the oldest cycle until there are three cycles left
		do {
			recap += `\nPour les ${number_of_days_between_cycles.length} derniers cycles :\n`;

			// Calculate the average number of days between cycles
			recap += `Durée moyenne des cycles : ${average(number_of_days_between_cycles).toFixed(1)} jours\n`;

			// Calculate the standard deviation of the number of days between cycles
			recap += `Écart type : ${stddev(number_of_days_between_cycles).toFixed(1)} jours\n`;

			// Remove the oldest cycle
			number_of_days_between_cycles_copy.shift();
		} while (number_of_days_between_cycles_copy.length > 2);

		// Add the number of days since the last period started
		recap += `\nJours depuis le début des dernières règles : ${Math.round((new Date() - new Date(last_cycle_first_entry.date)) / (24 * 60 * 60 * 1000))}`;

		// -------- AI analysis --------

		// AI system
		const system = `
			Tu es un outil d'analyse de données du cycle menstruel.
			Tu recevras des données brutes du cycle menstruel, avec pour chaque jour la date, le flux (de 0 à 4) et la douleur (de 0 à 4) (0 étant très faible et 4 étant très élevé).
			Tu vas analyser les données afin de fournir les informations suivantes :

			- Le nombre de jours depuis le début des dernières règles.
			- Une estimation de la date des prochaines règles.
			
			- La phase actuelle (règles, folliculaire, ovulation, lutéale).
			- Une brève description de la phase actuelle du cycle (ce que c'est, la durée moyenne, les conséquences sur le corps, les émotions, la libido, etc.).
			- Si en phase de règles :
				- Une estimation du flux (de 0 à 4).
				- Une estimation de la douleur (de 0 à 4).
				- Une estimation du nombre de jours restants avant la fin des règles.
			
			Si tu n'as pas assez de données pour fournir une estimation, base toi sur une moyenne de 5 jours de règles et 28 jours de cycle.

			- Si l'utilisatrice a du retard sur ses règles, la probabilité qu'elle soit enceinte ("Très faible", "Faible", "Moyenne", "Forte" "Très forte") (avec majuscule)
			- Une estimation du risque de grossesse en cas de rapport sexuel non protégé aujourd'hui ("très faible", "faible", "moyen", "élevé", "très élevé") (en minuscules)

			- Une brève analyse des données du cycle menstruel, en se basant sur les données fournies, en expliquant les tendances, les anomalies, et en donnant des conseils si nécessaire.

			Pour les deux derniers points, utilise des phrases simples et sépare les paragraphes par des sauts de ligne pour une meilleure lisibilité.

			- Une estimation des deux prochains cycles menstruels (et celui actuel si en phase de règles), avec le même format de jours que les données brutes (date;flux;douleur), en se basant sur les données fournies. Les valeurs 0 ne veulent pas dire qu'il n'y a pas de règles, mais que le flux ou la douleur sont très faibles. Les jours sans règles ne sont simplement pas renseignés.

			- Une estimation des deux prochaines périodes d'ovulation, avec les dates seulement.

			N'ajoute pas de commentaires ou d'explications supplémentaires, juste les données demandées.

			Voici un exemple de resultat et format attendu, toujours en français (les valeurs sont fictives et à ne pas prendre en compte) :

			\`\`\`
				<days-since-last-period>2</days-since-last-period>
				<next-period-date>2023-11-07</next-period-date>
				
				<current-phase>règles</current-phase>
				<period-flow>3</period-flow>
				<period-pain>2</period-pain>
				<days-left-in-period>3</days-left-in-period>
				<phase-description>La phase des règles [...] mais cela varie d'une personne à l'autre.</phase-description>
				
				<pregnancy-probability>Aucune</pregnancy-probability>
				<pregnancy-risk>Très faible</pregnancy-risk>
				
				<cycle-analysis>Le cyle du mercredi 5 décembre aurait duré 54 jours. Auriez-vous oublié de saisir le cycle précédent ? Au vu des autres cycles, vous auriez dû avoir vos rêgles du jeudi 6 au lundi 10 novembre.\\n\\nSinon, votre cycle semble régulier, mais vous semblez avoir des douleurs plus importantes ces derniers mois. Il est conseillé de consulter un professionnel de santé si cela persiste.</cycle-analysis>

				<next-cycles>
					2023-10-17;3;2 
					2023-10-18;2;1
					2023-10-19;0;0

					2023-11-07;2;4
					2023-11-08;4;3
					2023-11-09;3;2
					2023-11-10;2;1
					2023-11-11;0;0

					2023-12-05;2;4
					2023-12-06;4;3
					2023-12-07;3;2
					2023-12-08;2;1
					2023-12-09;0;0
				</next-cycles>

				<next-ovulation>
					2023-10-31
					2023-11-30
				</next-ovulation>
			\`\`\`

			Si tu n'as pas de valeurs pour un tag, n'inclue pas le tag dans le résultat (ne jamais laisser un tag vide ou mettre "N/A" ou "null").
		`;

		// AI user
		let user = `
			Aujourd'hui, nous sommes le ${new Date().toISOString().split('T')[0]}.
		
			Voici le récapitulatif des données du cycle menstruel :
			${recap}
		`;

		// Get result from local storage if available
		let analysis_result = localStorage.getItem('ai-analysis');
		let current_date = new Date().toISOString().split('T')[0];
		let new_day = localStorage.getItem('ai-analysis-date') !== current_date;

		// Generate the AI analysis
		if (!analysis_result || new_day) analysis_result = await AI.generate({ system, user });

		// Save the result to local storage
		localStorage.setItem('ai-analysis', analysis_result);
		localStorage.setItem('ai-analysis-date', current_date);

		// Get a given tag's value from the AI result
		const getTagValue = tag => {
			const regex = new RegExp(`<${tag}>(.*?)</${tag}>`, 's');
			const match = analysis_result.match(regex);
			const val = match ? match[1].trim() : null;

			// If val is a number, parse it
			if (val !== null && !isNaN(val)) return parseFloat(val);
			return val;
		};

		// Set analyse button icon
		analysis_button.classList.remove('color-spin');
		analysis_button.innerText = 'wb_sunny';
		const period_flow = (getTagValue('period-flow') || -1) + 1;
		analysis_button.innerText = ['wb_sunny', 'partly_cloudy_day', 'cloud', 'rainy', 'rainy', 'thunderstorm'][period_flow];
		analysis_button.setAttribute('style', `color: var(--${['yellow', 'orange', 'orange', 'red', 'red', 'red'][period_flow]})`);
		analysis_button.classList.toggle('slow-spin', period_flow === 0);

		// Calculate the cycle duration
		const days_since_last_period = getTagValue('days-since-last-period');
		const days_until_next_period = Math.round((new Date(getTagValue('next-period-date')) - new Date()) / (24 * 60 * 60 * 1000));
		const total_cycle_duration = days_since_last_period + days_until_next_period;

		// -------- Clock --------

		// Set analysis clock progress
		const progress = Math.ceil((days_since_last_period / total_cycle_duration) * 100);
		this.$('#analysis-clock .circular-progress').setAttribute('style', `--progress-value: ${progress}`);

		// Set clock content
		this.$('#analysis-clock .clock-day-val').innerText = getTagValue('days-since-last-period');
		this.$('#analysis-clock .clock-period').innerText = `Règles dans ${days_until_next_period} jours`;

		const week_days = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
		const months = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
		const date = new Date(getTagValue('next-period-date'));
		const formatted_date = `${week_days[date.getDay()]} ${date.getDate()} ${months[date.getMonth()]}`;
		this.$('#analysis-clock .clock-date').innerText = `Le ${formatted_date}`;

		// If days left in period is not null, show it in the clock
		const days_left_in_period = getTagValue('days-left-in-period');
		if (days_left_in_period !== null) this.$('#analysis-clock .clock-period').innerText = `Encore ${days_left_in_period} jours de règles`;

		// -------- Phase --------

		// Set phase

		this.$('.analysis-phase').innerText = getTagValue('current-phase');
		for (const p of getTagValue('phase-description').replaceAll('\\n', '\n').split(/\n+/)) {
			const p_el = document.createElement('p');
			p_el.innerText = p.trim();
			// Add paragraph before the panel wrapper
			this.$('#analysis-phase-container').insertBefore(p_el, this.$('#analysis-phase-container .panel-wrapper'));
		}

		// Set pregnancy probability
		let colors = {
			'Très faible': 'green',
			Faible: 'green',
			Moyenne: 'yellow',
			Forte: 'orange',
			'Très forte': 'red'
		};

		$('.pregnancy-probability').label = `${getTagValue('pregnancy-probability') || 'Très faible'} probabilité que vous soyez enceinte`;
		$('.pregnancy-probability').setAttribute('style', `color: var(--${colors[getTagValue('pregnancy-probability')] || 'green'})`);

		// Set pregnancy risk
		colors = {
			'très faible': 'green',
			faible: 'yellow',
			moyen: 'orange',
			élevé: 'red',
			'très élevé': 'red'
		};

		$('.pregnancy-risk').label = `Risque ${getTagValue('pregnancy-risk') || 'très faible'} en cas de rapport non protégé`;
		$('.pregnancy-risk').setAttribute('style', `color: var(--${colors[getTagValue('pregnancy-risk')]})`);

		// -------- Cycle analysis --------

		// Set the labels for the analysis panels
		$('.analysis-period-duration').label = `Durée moyenne des règles : ${Math.round(average(period_durations))} jours`;
		$('.analysis-cycles-average').label = `Durée moyenne des cycles : ${Math.round(average(number_of_days_between_cycles))} jours`;
		$('.analysis-cycles-deviation').label = `Écart type : ${stddev(number_of_days_between_cycles).toFixed(1)} jours`;

		// Add the current cycle to the number of days between cycles
		number_of_days_between_cycles.push(getTagValue('days-since-last-period') || 0);

		// Get the longest cycle
		let longest_cycle = Math.max(...number_of_days_between_cycles);
		if (number_of_days_between_cycles.length < 2) longest_cycle = 28; // Default to 28 days if not enough data

		$('.analysis-cycles-count').innerText = number_of_days_between_cycles.length;

		// Add cycles to graph
		const graph = this.$('.cycle-graph');
		for (let i = 0; i < number_of_days_between_cycles.length; i++) {
			graph.innerHTML += html`
				<div class="cycle">
					<div class="cycle-total hidden" style="--duration: ${total_cycle_duration / longest_cycle}"></div>
					<div class="cycle-duration" style="--duration: ${number_of_days_between_cycles[i] / longest_cycle}"></div>
					<div class="cycle-period" style="--duration: ${period_durations[i] / longest_cycle}"></div>
				</div>
			`;
		}

		// If less than 6 cycles, add .left class to the graph
		if (number_of_days_between_cycles.length < 8) graph.classList.add('left');

		// Remove the last cycle's estimated total duration
		graph.$('.cycle:last-child .hidden').classList.remove('hidden');

		for (const p of getTagValue('cycle-analysis').replaceAll('\\n', '\n').split(/\n+/)) {
			const p_el = document.createElement('p');
			p_el.innerText = p.trim();
			this.$('#cycle-analysis-container').appendChild(p_el);
		}

		// -------- Questions --------

		// Input event
		$('#analysis-questions .question .label').oninput = async e => {
			const val = e.target.innerText.trim();
			if (!val) e.target.innerText = '';
		};

		// Chat history
		const chat_history = ["Assistant: Bonjour ! Je m'appelle Nono et je suis là pour répondre à vos questions sur votre cycle menstruel."];

		// Validate the question input
		$('#analysis-questions .question .label').onkeydown = async e => {
			// If enter key is pressed
			if (e.key === 'Enter') {
				// Prevent default behavior
				e.preventDefault();

				// Ignore if already waiting for an answer
				if ($('#analysis-questions .question .main.icon').classList.contains('spin')) return;

				// Spin the icon
				$('#analysis-questions .question .main.icon').classList.add('spin');
				$('#analysis-questions .question .main.icon').innerText = 'autorenew';

				// Get the question
				const question = e.target.innerText.trim();
				chat_history.push(`User: ${question}`);

				// Clear the input
				e.target.innerText = '';

				// AI system
				const system = `
					Tu es un assistant virtuel spécialisé dans les questions sur le cycle menstruel.
					Ton nom est Nono et tu es là pour répondre aux questions des utilisatrices sur leur cycle menstruel.
					Tu as accès aux données du cycle menstruel de l'utilisatrice, utilise-les pour répondre aux questions.
					Tu peux également répondre aux questions générales sur le cycle menstruel, les règles, l'ovulation, la contraception, etc.
					Ne dis pas bonjour si tu l'as déjà dit, ne te présente pas et ne dis pas que tu es un assistant virtuel.
					Ne formate pas les réponses avec *, _ ou autres caractères spéciaux, juste du texte brut.
					Tu peux cependant mettre des sauts de ligne pour séparer les paragraphes et des "-" pour faire des listes à puces.
				`;

				// AI user
				let user = `
					# Données du cycle menstruel de l'utilisatrice
					${recap}

					# Analyse du cycle menstruel de l'utilisatrice
					${analysis_result}

					# Historique du chat
				`;

				// Add the chat history to the user message
				for (const message of chat_history) {
					user += `${message}\n`;
				}

				console.log(user);

				// Generate the answer
				const answer = await AI.generate({ system, user }, async (chunk, result) => {
					$('#analysis-questions .answer').innerText = result;
				});

				// Add the answer to the chat history
				chat_history.push(`Assistant: ${answer}`);

				// Remove the spin class
				$('#analysis-questions .question .main.icon').classList.remove('spin');
				$('#analysis-questions .question .main.icon').innerText = 'magic_button';
			}
		};

		// -------- Calendar page --------

		// Get the next period dates
		const next_cycles = getTagValue('next-cycles')
			.split('\n')
			.filter(Boolean)
			.map(line => {
				const [date, flow, pain] = line.trim().split(';');
				return { date, flow: parseInt(flow), pain: parseInt(pain) };
			});

		// For each next cycle entry
		entries: for (const entry of next_cycles) {
			// Select the day tile for the entry date
			const day_tile = this.$('calendar-page').getDayTile(new Date(entry.date));

			// If this days already has a flow class, skip it
			for (let i = 0; i < 5; i++) {
				if (day_tile.classList.contains(`flow-${i}`)) continue entries;
			}

			// Add classes
			day_tile.classList.add(`ai-flow-${entry.flow}`, `ai-pain-${entry.pain}`);

			navigator.vibrate?.(10);
			await delay(100);
		}

		// Get the next ovulation dates
		const next_ovulation = getTagValue('next-ovulation')
			.split('\n')
			.filter(Boolean)
			.map(date => new Date(date.trim()));

		// For each next ovulation date
		for (const date of next_ovulation) {
			// Select the day tile for the ovulation date
			const day_tile = this.$('calendar-page').getDayTile(date);

			// Add ovulation class
			day_tile.classList.add('ai-ovulation');

			// Id today
			if (DATE.isToday(date)) {
				// Change analysis Icon to ovulation
				analysis_button.innerText = 'psychiatry';
				analysis_button.setAttribute('style', 'color: var(--blue)');
				analysis_button.classList.remove('slow-spin');
			}

			navigator.vibrate?.(10);
			await delay(100);
		}

		// -------- Weather --------

		const weather = this.$('#analysis-weather');
		let day = new Date();

		// For the next 7 days, set the weather icon and color
		for (let i = 0; i < 7; i++) {
			// Get tile for the day
			const tile = $('calendar-page').getDayTile(day);

			// Default no-period day
			let icon = 'wb_sunny';
			let color = 'yellow';

			// Icons
			const icons = {
				'ai-flow-0': 'partly_cloudy_day',
				'ai-flow-1': 'cloud',
				'ai-flow-2': 'rainy',
				'ai-flow-3': 'rainy',
				'ai-flow-4': 'thunderstorm',
				'ai-ovulation': 'psychiatry'
			};

			// Colors
			const colors = {
				'ai-flow-0': 'orange',
				'ai-flow-1': 'orange',
				'ai-flow-2': 'red',
				'ai-flow-3': 'red',
				'ai-flow-4': 'red',
				'ai-ovulation': 'blue'
			};

			// For each value
			for (const key in icons) {
				// If the tile has the class, set the icon and color
				if (tile.classList.contains(key)) {
					icon = icons[key];
					color = colors[key];
					break;
				}
			}

			const week_days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

			// Add the weather icon
			weather.innerHTML += html`
				<div class="weather-day">
					<span class="icon" style="color: var(--${color})">${icon}</span>
					<span class="weather-day-text">${week_days[day.getDay()]}</span>
				</div>
			`;

			// Increment day
			day.setDate(day.getDate() + 1);
		}
	}
}

defineComponent(html`<main-app />`);
