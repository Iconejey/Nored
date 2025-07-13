class CalendarMonth extends CustomElement {
	static MONTHS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

	constructor() {
		super();

		this.whenReady(async () => {
			// Get the first day of the month
			const year = parseInt(this.year);
			const month = parseInt(this.month) || 0;
			let date = new Date(year, month, 1);

			// Set inner HTML
			this.innerHTML = html`
				<span class="month-name">${CalendarMonth.MONTHS[month]}</span>
				<div class="day-names">
					<span class="day-name">Lu</span>
					<span class="day-name">Ma</span>
					<span class="day-name">Me</span>
					<span class="day-name">Je</span>
					<span class="day-name">Ve</span>
					<span class="day-name">Sa</span>
					<span class="day-name">Di</span>
				</div>
				<div class="days"></div>
			`;

			let week_container;

			// Get the first day in the week of the month
			const first_day = date.getDay() === 0 ? 6 : date.getDay() - 1; // Adjust for Monday as the first day of the week

			// If the month does not start on a Monday, we need to add empty days before the first day of the month
			if (first_day > 0) {
				// Add a week container
				week_container = this.addWeek();

				// Add empty days before the first day of the month
				for (let i = 0; i < first_day; i++) {
					week_container.appendChild(render(html`<span class="day empty"></span>`));
				}
			}

			// Add days of the month
			while (date.getMonth() === month) {
				// If the day is monday, add a new week container
				if (date.getDay() === 1) week_container = this.addWeek();

				// Get the day of the month
				const day = date.getDate();

				const elem = render(html`<span class="day" value="${day}">${day}</span>`);
				week_container.appendChild(elem);

				// If the day is today, add a special class
				if (day === new Date().getDate() && date.getMonth() === new Date().getMonth() && date.getFullYear() === new Date().getFullYear()) {
					elem.classList.add('today');
				}

				// On click, dispatch a custom event with the date
				elem.addEventListener('click', e => {
					e.stopPropagation();
					navigator.vibrate(10);
					$('.day.selected')?.classList.remove('selected');
					elem.classList.add('selected');
					this.scrollIntoView({ block: 'start', behavior: 'smooth' });
					const event_date = new Date(this.year, this.month, day);
					event_date.setHours(12, 0, 0, 0);
					this.dispatchEvent(new CustomEvent('date-selected', { detail: { date: event_date }, bubbles: true }));
				});

				// Increment the date
				date.setDate(day + 1);
			}

			// Add empty days after the last day of the month
			while (date.getDay() !== 1) {
				week_container.appendChild(render(html`<span class="day empty"></span>`));
				date.setDate(date.getDate() + 1);
			}

			// Get month data from storage
			this.data = await app.getMonthData(year, month);

			// For each entry in the month data
			for (const date in this.data) {
				const day_data = this.data[date];
				const date_obj = new Date(date);
				const day_elem = this.$(`.day[value="${date_obj.getDate()}"]`);

				day_elem.classList.add(`flow-${day_data.flow || 0}`);
				day_elem.classList.add(`pain-${day_data.pain || 0}`);
			}
		});
	}

	// Add a week container
	addWeek() {
		const week_container = render(html`<div class="week"></div>`);
		this.$('.days').appendChild(week_container);
		return week_container;
	}
}

defineComponent(html`<calendar-month year month />`);
