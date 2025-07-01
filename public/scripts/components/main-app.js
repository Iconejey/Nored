class MainApp extends CustomElement {
	constructor() {
		super();

		// Auth from URL
		authFromURL();

		// Wait for DOM to be ready
		this.whenReady(() => {
			// Log every storage change
			STORAGE.onChange(console.log);

			// Set the inner HTML
			this.innerHTML = html`
				<account-panel></account-panel>
				<form>
					<input type="text" name="content" placeholder="Some text" required />
					<button type="submit">Write to storage</button>
				</form>
			`;

			// Handle form submit
			this.$('form').onsubmit = async e => {
				e.preventDefault();
				const value = this.$('input').value;
				await STORAGE.write('test.txt', value);
			};
		});
	}
}

defineComponent(html`<main-app />`);
