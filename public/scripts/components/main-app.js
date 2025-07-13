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

		// Filter out days between cycles that are more than 45 days
		number_of_days_between_cycles = number_of_days_between_cycles.filter(days => days <= 45);
		recap += `\nMême calcul si on ignore les cycles de plus de 45 jours (peut-être des oublis de saisie) :\n`;

		// Calculate the average number of days between cycles
		average_days_between_cycles = number_of_days_between_cycles.reduce((a, b) => a + b, 0) / number_of_days_between_cycles.length;
		recap += `\nDurée moyenne des cycles : ${average_days_between_cycles.toFixed(2)} jours\n`;

		// Calculate the standard deviation of the number of days between cycles
		variance = number_of_days_between_cycles.reduce((acc, val) => acc + Math.pow(val - average_days_between_cycles, 2), 0) / number_of_days_between_cycles.length;
		stddev = Math.sqrt(variance);
		recap += `Écart type : ${stddev.toFixed(2)} jours\n`;

		return recap.trim();
	}

	// Analyze the data using AI
	async analyzeData() {
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
				- Une courte description de la phase actuelle du cycle (ce que c'est, la durée moyenne, les conséquences sur le corps, les émotions, la libido, etc.).

			- Une courte analyse des données du cycle menstruel, en se basant sur les données fournies, en expliquant les tendances, les anomalies, et en donnant des conseils si nécessaire. Ajouter des \\n pour séparer les paragraphes.

			- Une estimation des deux prochains cycles menstruels (et celui actuel si en phase de règles), avec le même format de jours que les données brutes (date;flux;douleur), en se basant sur les données fournies.

			Voici un exemple de resultat et format attendu (les valeurs sont fictives et à ne pas prendre en compte) :

			\`\`\`
				<days-since-last-period>2</days-since-last-period>
				<average-cycle-duration>28</average-cycle-duration>
				<next-period-date>2023-10-15</next-period-date>
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

		// // Generate the AI analysis
		// const result = await AI.generate({ system, user });

		// Fake AI analysis result for dev purposes
		return `
			AI analysis result: \`\`\`
			<days-since-last-period>16</days-since-last-period>
			<average-cycle-duration>22</average-cycle-duration>
			<next-period-date>2025-07-20</next-period-date>
			<pregnancy-risk>très faible</pregnancy-risk>
			<current-phase>lutéale</current-phase>
			<phase-description>La phase lutéale commence après l'ovulation et dure jusqu'au début des prochaines règles. Sa durée est généralement stable, autour de 10 à 16 jours (souvent 14 jours). Pendant cette phase, le corps produit principalement de la progestérone, qui prépare l'utérus à une éventuelle grossesse. En l'absence de fécondation, les niveaux d'hormones chutent, provoquant le détachement de la muqueuse utérine (les règles). Cette phase peut s'accompagner de symptômes prémenstruels (syndrome prémenstruel - SPM) tels que des ballonnements, une sensibilité des seins, des changements d'humeur (irritabilité, anxiété), de la fatigue ou des fringales. La libido a tendance à diminuer après le pic de la phase d'ovulation.</phase-description>
			<cycle-analysis>Les données fournies montrent une grande variabilité dans la durée de vos cycles, allant de 18 à 54 jours. Les cycles de 50 et 54 jours se démarquent nettement des autres, qui sont compris entre 18 et 27 jours. L'analyse complémentaire suggère d'ignorer ces cycles plus longs, ce qui semble pertinent si ce sont des exceptions ou potentiellement liés à des oublis de saisie. En excluant ces valeurs extrêmes, la durée moyenne de vos cycles est d'environ 22 jours, ce qui est plus court que la moyenne communément citée de 28 jours, mais reste dans une fourchette normale. L'écart type réduit (4.02 jours vs 11.34 jours) pour les cycles plus courts indique une meilleure régularité parmi ceux-ci.

			Un point notable dans vos données est l'absence totale de douleur (toujours notée 0) pendant vos règles, même lors des jours de flux abondant (3 ou 4). Si cela correspond à la réalité, c'est une caractéristique positive de vos cycles. Le flux semble varier d'un cycle à l'autre en termes de durée (de 1 à 6 jours) et d'intensité maximale, mais suit globalement un schéma typique de début léger à modéré, pic, puis diminution.

			Si les cycles très longs sont fréquents, il serait pertinent de consulter un professionnel de santé, car une grande irrégularité peut parfois indiquer un déséquilibre hormonal. Si ces cycles longs sont rares et que vos cycles se stabilisent autour de 18-27 jours, cela peut simplement être votre rythme naturel, bien que plus court que la moyenne. Continuez à suivre vos cycles pour identifier si la tendance est à la stabilisation ou à la persistance des cycles très longs ou très courts.</cycle-analysis>
			<next-cycles>
			2025-07-20;2;0
			2025-07-21;4;0
			2025-07-22;2;0
			2025-07-23;1;0

			2025-08-11;2;0
			2025-08-12;4;0
			2025-08-13;2;0
			2025-08-14;1;0
			</next-cycles>
			\`\`\`
		`;
	}
}

defineComponent(html`<main-app />`);
