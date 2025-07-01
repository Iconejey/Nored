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

				<footer>
					<div class="comment">
						<span class="icon">magic_button</span>
						<span class="text">Cliquez sur un jour où vous avez eu vos règles.</span>
					</div>

					<div class="menu">
						<account-panel />
					</div>
				</footer>
			`;

			// Open menu on header icon click
			this.$('header .icon').onclick = e => {
				e.stopPropagation();
				body_class.add('menu');
				navigator.vibrate?.(10);
			};

			// Remove menu on click if authenticated
			this.onclick = e => {
				if (localStorage.getItem('token')) {
					body_class.remove('menu');
					navigator.vibrate?.(10);
				}
			};

			// If not authenticated, show menu
			if (!localStorage.getItem('token')) body_class.add('menu');
			// Else bloom
			else {
				await delay(500);
				this.$('.logo').classList.remove('hidden');
				await delay(1200);
				this.$('.logo').classList.add('bloom');
			}

			// Move the logo on click
			this.$('.logo').onclick = async e => {
				e.stopPropagation();
				console.log('Logo clicked');
				navigator.vibrate?.([50, 50, 10]);
				this.$('.logo').classList.remove('bloom');
				await delay(500);
				this.$('.logo').classList.add('bloom');
			};
		});
	}
}

defineComponent(html`<main-app />`);
