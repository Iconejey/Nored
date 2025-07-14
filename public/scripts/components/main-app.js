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

	// Get the data recap for analysis
	async getDataRecap() {
		const entries = [];

		// For each calendar month data
		for (const { data } of $$('calendar-month')) {
			// For each entry in the month data
			for (const key in data) entries.push(data[key]);
		}

		// If no entries, return null
		if (entries.length === 0) return null;

		// Sort entries by date
		entries.sort((a, b) => new Date(a.date) - new Date(b.date));

		let recap = '';
		let last_entry = null;
		let last_cycle_first_entry = null;
		let duration_days_count = 0;
		let number_of_days_between_cycles = [];

		for (const entry of entries) {
			// Increment the days count
			duration_days_count++;

			// Get the number of days since the last entry
			const days_since_last_entry = last_entry ? (new Date(entry.date) - new Date(last_entry.date)) / (24 * 60 * 60 * 1000) : 0;

			// Check if the last date is more than a week ago
			if (days_since_last_entry > 7) {
				// get the days since the last cycle first entry
				const days_since_last_cycle_first_entry = (new Date(entry.date) - new Date(last_cycle_first_entry.date)) / (24 * 60 * 60 * 1000);

				// Add days since last cycle first entry to the recap
				// recap += `Règles pendant ${duration_days_count - 1} jours (${last_cycle_first_entry.date} - ${last_entry.date})\n`;
				recap += `Règles pendant ${duration_days_count - 1} jours\n`;
				recap += `\n${days_since_last_cycle_first_entry} jours après le début des règles précédentes :\n`;

				// Set the last cycle first entry to the current entry
				last_cycle_first_entry = entry;

				// Reset the duration days count
				duration_days_count = 1;

				// Add the number of days between cycles
				number_of_days_between_cycles.push(days_since_last_entry);
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
		recap += `\n------\n`;

		// Calculate the average number of days between cycles
		let average_days_between_cycles = number_of_days_between_cycles.reduce((a, b) => a + b, 0) / number_of_days_between_cycles.length;
		recap += `\nDurée moyenne des cycles : ${average_days_between_cycles.toFixed(2)} jours\n`;

		// Calculate the standard deviation of the number of days between cycles
		let variance = number_of_days_between_cycles.reduce((acc, val) => acc + Math.pow(val - average_days_between_cycles, 2), 0) / number_of_days_between_cycles.length;
		let stddev = Math.sqrt(variance);
		recap += `Écart type : ${stddev.toFixed(2)} jours\n`;

		// Add the number of days since the last period started
		recap += `\nJours depuis le début des dernières règles : ${Math.round((new Date() - new Date(last_cycle_first_entry.date)) / (24 * 60 * 60 * 1000))}`;

		return recap;
	}

	// Analyze the data using AI
	async analyzeData() {
		// Analyze button
		const analysis_button = this.$('#analysis.icon');

		// Get the data recap
		const recap = await this.getDataRecap();
		if (!recap) return;

		// AI system
		const system = `
			Tu es un outil d'analyse de données du cycle menstruel.
			Tu recevras des données brutes du cycle menstruel, avec pour chaque jour la date, le flux (de 0 à 4) et la douleur (de 0 à 4) (0 étant très faible et 4 étant très élevé).
			Tu vas analyser les données afin de fournir les informations suivantes :

			- Le nombre de jours depuis le début des dernières règles.
			- La durée moyenne des cycles.
			- Une estimation de la date des prochaines règles.
			- Une estimation du risque de grossesse en cas de rapport sexuel non protégé aujourd'hui ("très faible", "faible", "moyen", "élevé", "très élevé").

			- La phase actuelle (règles, folliculaire, ovulation, lutéale).
			- Si en phase de règles :
				- Une estimation du flux (de 0 à 4).
				- Une estimation de la douleur (de 0 à 4).
				- Une estimation du nombre de jours restants avant la fin des règles.

			- Une brève description de la phase actuelle du cycle (ce que c'est, la durée moyenne, les conséquences sur le corps, les émotions, la libido, etc.).

			- Une brève analyse des données du cycle menstruel, en se basant sur les données fournies, en expliquant les tendances, les anomalies, et en donnant des conseils si nécessaire.

			Pour les deux derniers points, utilise des phrases simples et sépare les paragraphes par des sauts de ligne pour une meilleure lisibilité.

			- Une estimation des deux prochains cycles menstruels (et celui actuel si en phase de règles), avec le même format de jours que les données brutes (date;flux;douleur), en se basant sur les données fournies. Les valeurs 0 ne veulent pas dire qu'il n'y a pas de règles, mais que le flux ou la douleur sont très faibles. Les jours sans règles ne sont simplement pas renseignés.

			Voici un exemple de resultat et format attendu (les valeurs sont fictives et à ne pas prendre en compte) :

			\`\`\`
				<days-since-last-period>2</days-since-last-period>
				<average-cycle-duration>28</average-cycle-duration>
				<next-period-date>2023-11-07</next-period-date>
				<pregnancy-risk>moyen</pregnancy-risk>
				<current-phase>règles</current-phase>
				<period-flow>3</period-flow>
				<period-pain>2</period-pain>
				<days-left-in-period>3</days-left-in-period>
				<phase-description>La phase des règles [...] mais cela varie d'une personne à l'autre.</phase-description>
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
			\`\`\`
		`;

		// AI user
		let user = `
			Aujourd'hui, nous sommes le ${new Date().toISOString().split('T')[0]}.
		
			Voici le récapitulatif des données du cycle menstruel :
			${recap}
		`;

		// Get result from local storage if available
		let result = localStorage.getItem('ai-analysis');
		let current_date = new Date().toISOString().split('T')[0];
		let new_day = localStorage.getItem('ai-analysis-date') !== current_date;

		// Generate the AI analysis
		if (!result || new_day) result = await AI.generate({ system, user });

		// Save the result to local storage
		localStorage.setItem('ai-analysis', result);
		localStorage.setItem('ai-analysis-date', current_date);

		// Get a given tag's value from the AI result
		const getTagValue = tag => {
			const regex = new RegExp(`<${tag}>(.*?)</${tag}>`, 's');
			const match = result.match(regex);
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
		analysis_button.setAttribute('style', `color: var(--${['yellow', 'orange', 'orange', 'red', 'red', 'purple'][period_flow]})`);
		analysis_button.classList.toggle('slow-spin', period_flow === 0);

		// Calculate the cycle duration
		const days_since_last_period = getTagValue('days-since-last-period');
		const days_until_next_period = Math.round((new Date(getTagValue('next-period-date')) - new Date()) / (24 * 60 * 60 * 1000));
		const total_cycle_duration = days_since_last_period + days_until_next_period;

		// Set analysis clock progress
		const progress = Math.ceil((days_since_last_period / total_cycle_duration) * 100);
		this.$('#analysis-clock .circular-progress').setAttribute('style', `--progress-value: ${progress}`);

		// Set clock content
		this.$('#analysis-clock .clock-day-val').innerText = getTagValue('days-since-last-period');
		this.$('#analysis-clock .clock-period').innerText = `Règles dans ${days_until_next_period} jours`;
		this.$('#analysis-clock .clock-pregnancy').innerText = `Risque de grossesse ${getTagValue('pregnancy-risk')}`;

		// Set phase
		this.$('.analysis-phase').innerText = getTagValue('current-phase');
		for (const p of getTagValue('phase-description').replaceAll('\\n', '\n').split(/\n+/)) {
			const p_el = document.createElement('p');
			p_el.innerText = p.trim();
			this.$('#analysis-phase-container').appendChild(p_el);
		}

		// Set analysis
		for (const p of getTagValue('cycle-analysis').replaceAll('\\n', '\n').split(/\n+/)) {
			const p_el = document.createElement('p');
			p_el.innerText = p.trim();
			this.$('#cycle-analysis-container').appendChild(p_el);
		}

		// Get the next period dates
		const next_cycles = getTagValue('next-cycles')
			.split('\n')
			.filter(Boolean)
			.map(line => {
				const [date, flow, pain] = line.trim().split(';');
				return { date, flow: parseInt(flow), pain: parseInt(pain) };
			});

		// For each next cycle entry
		for (const entry of next_cycles) {
			// Select the day tile for the entry date
			const day_tile = this.$('calendar-page').getDayTile(new Date(entry.date));

			// Add classes
			day_tile.classList.add(`ai-flow-${entry.flow}`, `ai-pain-${entry.pain}`);

			navigator.vibrate?.(10);
			await delay(100);
		}
	}
}

defineComponent(html`<main-app />`);
