// This is a period cycle tracker application.
class MainApp extends CustomElement {
	constructor() {
		super();

		// Auth from URL
		authFromURL();

		// Wait for DOM to be ready
		this.whenReady(async () => {
			// Log every storage change
			STORAGE.onChange(console.log);

			// Get current month and year
			const date = new Date();
			const current_month = date.getMonth();
			const current_year = date.getFullYear();

			// Get next month
			const next_month = (current_month + 1) % 12;
			const next_year = next_month === 0 ? current_year + 1 : current_year;

			// Set the inner HTML
			this.innerHTML = html`
				<header>
					<span class="icon">short_text</span>
					<div class="logo hidden">
						<img class="logo-drop" src="/drop.svg" />
						<img class="logo-drop" src="/drop.svg" />
						<img class="logo-drop" src="/drop.svg" />
					</div>
					<span class="icon hidden">close</span>
				</header>

				<div class="calendar">
					<calendar-month year="${current_year}" month="${current_month}" />
					<calendar-month year="${next_year}" month="${next_month}" />
				</div>

				<footer>Cliquez sur un jour où vous avez eu vos règles.</footer>
			`;

			await delay(500);
			this.$('.logo').classList.remove('hidden');
			await delay(1200);
			this.$('.logo').classList.add('bloom');
		});
	}
}

defineComponent(html`<main-app />`);
