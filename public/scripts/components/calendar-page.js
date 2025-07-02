class CalendarPage extends CustomElement {
	constructor() {
		super();
		this.classList.add('page');

		this.whenReady(async () => {
			this.innerHTML = html`
				<header>
					<span id="account" class="icon">short_text</span>
					<div class="logo hidden">
						<img class="logo-drop" src="/drop.svg" />
						<img class="logo-drop" src="/drop.svg" />
						<img class="logo-drop" src="/drop.svg" />
					</div>
					<span id="today" class="icon">wb_sunny</span>
				</header>

				<div class="calendar"></div>
			`;

			// Populate the calendar with months
			this.populate();

			// Open menu on header icon click
			this.$('header .icon#account').onclick = e => {
				e.stopPropagation();
				navigator.vibrate?.(10);
				authenticate(true);
			};

			// Bloom the logo
			await delay(500);
			this.$('.logo').classList.remove('hidden');
			await delay(1200);
			this.$('.logo').classList.add('bloom');

			// Move the logo on click
			this.$('.logo').onclick = async e => {
				e.stopPropagation();
				navigator.vibrate?.([50, 50, 10]);
				this.$('.logo').classList.remove('bloom');
				await delay(200);
				this.$('.logo').classList.add('bloom');
			};

			// Refresh app on logo double click
			this.$('.logo').ondblclick = e => location.reload();
		});
	}

	// Populate the calendar with months
	populate() {
		// Get current month's first day
		const current_date = new Date();
		current_date.setDate(1);

		// Loop through months
		for (let i = -12; i <= 3; i++) {
			const date = new Date(current_date);
			date.setMonth(current_date.getMonth() + i);
			const year = date.getFullYear();
			const month = date.getMonth();

			console.log(`${year} ${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][month]}`);

			$('.calendar').appendChild(render(html`<calendar-month year="${year}" month="${month}" />`));
		}

		requestAnimationFrame(() => {
			// Scroll to the current month
			const current_month_element = this.$('.today').closest('calendar-month');
			current_month_element.scrollIntoView({
				block: 'start'
			});
		});
	}
}

defineComponent(html`<calendar-page />`);
