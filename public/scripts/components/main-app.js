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
}

defineComponent(html`<main-app />`);
