class CalendarPage extends CustomElement {
	constructor() {
		super();
		this.classList.add('page');

		this.whenReady(async () => {
			this.innerHTML = html`
				<header>
					<span id="menu" class="icon">short_text</span>
					<div class="logo hidden">
						<img class="logo-drop" src="/drop.svg" />
						<img class="logo-drop" src="/drop.svg" />
						<img class="logo-drop" src="/drop.svg" />
					</div>
					<span id="analysis" class="icon color-spin">magic_button</span>
				</header>

				<div class="calendar"></div>

				<div class="form"></div>
			`;

			// Populate the calendar with months
			if (userSignedIn()) this.populate();

			// Open menu page on menu icon click
			this.$('header #menu.icon').onclick = async e => {
				e.stopPropagation();
				body_class.add('menu');
				await delay(300);
				navigator.vibrate?.(10);
			};

			// Open analysis page on analysis icon click
			this.$('header #analysis.icon').onclick = async e => {
				e.stopPropagation();
				if (e.target.classList.contains('color-spin')) return;
				app.analyzeTodayCycleData();
				body_class.add('analysis');
				await delay(300);
				navigator.vibrate?.(10);
			};

			// Open form on day selection
			this.addEventListener('date-selected', e => {
				// Only open the form if the selected date is today or in the past
				if (e.detail?.date > new Date() && !DATE.isToday(e.detail?.date)) return;

				// Open the form for the selected date
				this.openForm(e.detail?.date);
			});

			// Close form on click outside
			this.onclick = e => {
				if (body_class.contains('form-open') && !e.target.closest('.form')) {
					body_class.remove('form-open');
					$('.day.selected')?.classList.remove('selected');
				}
			};

			// Animate analysis btn color
			let current_color = null;
			setInterval(() => {
				if (!this.$('#analysis.icon').classList.contains('color-spin')) return;
				const colors = ['red', 'orange', 'yellow', 'green', 'cyan', 'blue', 'purple'].filter(color => color !== current_color);
				const random_color = colors[Math.floor(Math.random() * colors.length)];
				current_color = random_color;
				this.$('#analysis.icon').setAttribute('style', `color: var(--${random_color})`);
			}, 300);

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

			// Await for all calendar months to be ready
			await Promise.all([...this.$$('calendar-month')].map(month => month.ready_promise));

			// Dispatch ready event
			this.dispatchEvent(new CustomEvent('ready', { bubbles: true }));
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

	// Get a day tile elem from a date
	getDayTile(date) {
		const year = date.getFullYear();
		const month = date.getMonth();
		const day = date.getDate();

		// Handle navigator removing attributes with "0" as value (january)
		if (month === 0) return this.$(`calendar-month[year="${year}"][month] .day[value="${day}"]`);

		// Return the day tile element
		return this.$(`calendar-month[year="${year}"][month="${month}"] .day[value="${day}"]`);
	}

	// Open form for selected date
	async openForm(date) {
		const form = this.$('.form');

		// Get month data for the selected date
		const month_data = await app.getMonthData(date.getFullYear(), date.getMonth());
		const day_data = month_data[date.toISOString().split('T')[0]];

		form.innerHTML = html`
			<h3 class="date">${date.getDate()} ${CalendarMonth.MONTHS[date.getMonth()]} ${date.getFullYear()}</h3>

			<div class="form-actions">
				<h3>Flux :</h3>
				<div class="rate" id="flow">
					<span class="icon" value="4">water_drop</span>
					<span class="icon" value="3">water_drop</span>
					<span class="icon" value="2">water_drop</span>
					<span class="icon" value="1">water_drop</span>
					<span class="icon" value="0">water_drop</span>
				</div>
			</div>

			<div class="form-actions">
				<h3>Douleur :</h3>
				<div class="rate" id="pain">
					<span class="icon" value="4">bolt</span>
					<span class="icon" value="3">bolt</span>
					<span class="icon" value="2">bolt</span>
					<span class="icon" value="1">bolt</span>
					<span class="icon" value="0">bolt</span>
				</div>
			</div>

			<span class="btn disabled" id="save"><h3>Enregistrer</h3></span>
			<span class="btn hidden" id="delete"><h3>Supprimer</h3></span>
		`;

		// If data for the selected date exists
		if (day_data) {
			// Select the flow rate icon
			form.$(`.rate#flow .icon[value="${day_data.flow}"]`)?.classList.add('selected');

			// Select the pain rate icon
			form.$(`.rate#pain .icon[value="${day_data.pain}"]`)?.classList.add('selected');

			// Show the delete button
			form.$('.btn#delete').classList.remove('hidden');
			form.$('.btn#save').classList.add('hidden');
			form.$('.btn#save').classList.remove('disabled');
		}

		// Rate click
		form.$$('.rate .icon').forEach(icon => {
			icon.onclick = e => {
				e.stopPropagation();

				// Select the icon
				icon.parentElement.$('.icon.selected')?.classList.remove('selected');
				icon.classList.toggle('selected');

				// Check if both rates have a value
				const selected = form.$$('.rate .icon.selected');
				if (selected.length === 2) $('.btn#save').classList.remove('disabled');

				// Hide delete button
				form.$('.btn#delete').classList.add('hidden');
				form.$('.btn#save').classList.remove('hidden');
			};
		});

		// Save button click
		form.$('.btn#save').onclick = async e => {
			e.stopPropagation();
			if (form.$('.btn#save').classList.contains('disabled')) return;

			// Get the selected rates
			const flow_rate = form.$$('.rate')[0].querySelector('.icon.selected')?.getAttribute('value') || '0';
			const pain_rate = form.$$('.rate')[1].querySelector('.icon.selected')?.getAttribute('value') || '0';

			const period_day = {
				date: date.toISOString().split('T')[0],
				flow: parseInt(flow_rate),
				pain: parseInt(pain_rate)
			};

			// Close the form
			body_class.remove('form-open');
			$('.day.selected')?.classList.remove('selected');

			// Update classes and attributes
			let day_tile = this.getDayTile(date);
			day_tile.setAttribute('user-flow', period_day.flow);
			day_tile.setAttribute('user-pain', period_day.pain);

			// Get the month data
			const month_data = await app.getMonthData(date.getFullYear(), date.getMonth());

			// Set the period day in the month data
			month_data[period_day.date] = period_day;

			// Save the month data
			await app.saveMonthData(date.getFullYear(), date.getMonth(), month_data);
		};

		// Delete button click
		form.$('.btn#delete').onclick = async e => {
			e.stopPropagation();

			// Get the month data
			const month_data = await app.getMonthData(date.getFullYear(), date.getMonth());

			// Remove the period day from the month data
			delete month_data[date.toISOString().split('T')[0]];

			// Save the month data
			await app.saveMonthData(date.getFullYear(), date.getMonth(), month_data);

			// Close the form
			body_class.remove('form-open');
			$('.day.selected')?.classList.remove('selected');

			// Remove user attributes from the day element
			const day_elem = this.getDayTile(date);
			day_elem.removeAttribute('user-flow');
			day_elem.removeAttribute('user-pain');
		};

		// Open the form
		body_class.add('form-open');
	}
}

defineComponent(html`<calendar-page />`);
