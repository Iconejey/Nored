class CalendarMonth extends CustomElement {
	MONTHS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

	constructor() {
		super();

		this.whenReady(() => {
			// Get the first day of the month
			const year = parseInt(this.year);
			const month = parseInt(this.month);
			let date = new Date(year, month, 1);

			// Set inner HTML
			this.innerHTML = html`
				<span class="month-name">${this.MONTHS[month]}</span>
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

			// Add a week container
			let week_container = this.addWeek();

			// Get the first day in the week of the month
			const first_day = date.getDay() === 0 ? 6 : date.getDay() - 1; // Adjust for Monday as the first day of the week

			// Add empty days before the first day of the month
			for (let i = 0; i < first_day; i++) {
				week_container.innerHTML += html`<span class="day empty"></span>`;
			}

			// Add days of the month
			while (date.getMonth() === month) {
				// If the day is monday, add a new week container
				if (date.getDay() === 1) week_container = this.addWeek();

				// Get the day of the month
				const day = date.getDate();

				// If the day is today, add a special class
				if (day === new Date().getDate() && date.getMonth() === new Date().getMonth() && date.getFullYear() === new Date().getFullYear()) {
					week_container.innerHTML += html`<span class="day today">${day}</span>`;
				}

				// Normal day
				else {
					week_container.innerHTML += html`<span class="day">${day}</span>`;
				}

				// Increment the date
				date.setDate(day + 1);
			}

			// Add empty days after the last day of the month
			while (date.getDay() !== 1) {
				week_container.innerHTML += html`<span class="day empty"></span>`;
				date.setDate(date.getDate() + 1);
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
