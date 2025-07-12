class MainApp extends CustomElement {
	constructor() {
		super();
		window.app = this;

		// Auth from URL
		authFromURL();

		// Wait for DOM to be ready
		this.whenReady(async () => {
			// Log every storage change
			STORAGE.onChange(console.log);

			// We want user to be authenticated to use the app
			authenticate();

			// Set the inner HTML
			this.innerHTML = html`<calendar-page />`;
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
}

defineComponent(html`<main-app />`);
