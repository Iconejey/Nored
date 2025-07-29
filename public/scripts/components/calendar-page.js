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
					setTimeout(() => $('.day.selected')?.classList.remove('selected'), 200);
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
				<div class="form-item-list" id="flow">
					<div class="form-item" value="0">
						<span class="icon">partly_cloudy_day</span>
						<span class="label">À peine</span>
					</div>
					<div class="form-item" value="1">
						<span class="icon">cloud</span>
						<span class="label">Léger</span>
					</div>
					<div class="form-item" value="2">
						<span class="icon">rainy</span>
						<span class="label">Modéré</span>
					</div>
					<div class="form-item" value="3">
						<span class="icon">rainy</span>
						<span class="label">Important</span>
					</div>
					<div class="form-item" value="4">
						<span class="icon">thunderstorm</span>
						<span class="label">Très important</span>
					</div>
				</div>
			</div>

			<div class="form-actions">
				<h3>Sympômes :</h3>
				<div class="form-item-list" id="symptoms">
					<div class="form-item" value="cramps">
						<span class="icon">gynecology</span>
						<span class="label">Crampes</span>
					</div>
					<div class="form-item" value="breast_pain">
						<span class="icon">favorite</span>
						<span class="label">Douleurs mammaires</span>
					</div>
					<div class="form-item" value="skin_issues">
						<span class="icon">face</span>
						<span class="label">Éruptions cutanées</span>
					</div>
					<div class="form-item" value="fatigue">
						<span class="icon">battery_low</span>
						<span class="label">Fatigue</span>
					</div>
					<div class="form-item" value="headache">
						<span class="icon">psychology</span>
						<span class="label">Maux de tête</span>
					</div>
					<div class="form-item" value="mood_swings">
						<span class="icon">sentiment_stressed</span>
						<span class="label">Sautes d'humeur</span>
					</div>
					<div class="form-item" value="bloating">
						<span class="icon">water_drop</span>
						<span class="label">Ballonnements</span>
					</div>
					<div class="form-item" value="back_pain">
						<span class="icon">assist_walker</span>
						<span class="label">Bas du dos</span>
					</div>
					<div class="form-item" value="digestive">
						<span class="icon">gastroenterology</span>
						<span class="label">Digestion</span>
					</div>
					<div class="form-item" value="sleep_issues">
						<span class="icon">nights_stay</span>
						<span class="label">Troubles du sommeil</span>
					</div>
				</div>
			</div>

			<span class="btn disabled" id="save"><h3>Enregistrer</h3></span>
			<span class="btn hidden" id="delete"><h3>Supprimer</h3></span>
		`;

		// If data for the selected date exists
		if (day_data) {
			// Select the flow item
			form.$(`#flow .form-item[value="${day_data.flow}"]`)?.classList.add('selected');

			// Select the symptoms items
			day_data.symptoms?.forEach(symptom => {
				form.$(`#symptoms .form-item[value="${symptom}"]`)?.classList.add('selected');
			});

			// Show the delete button
			form.$('.btn#delete').classList.remove('hidden');
			form.$('.btn#save').classList.add('hidden');
			form.$('.btn#save').classList.remove('disabled');
		}

		// Update button after click
		const updateButton = () => {
			// If both flow selected, remove the disabled class
			if (form.$$('#flow .form-item.selected')) form.$('.btn#save').classList.remove('disabled');

			// Hide delete button
			form.$('.btn#delete').classList.add('hidden');
			form.$('.btn#save').classList.remove('hidden');
		};

		// Flow click
		form.$$('#flow .form-item').forEach(item => {
			item.onclick = e => {
				e.stopPropagation();
				navigator.vibrate?.(10);

				// Select the icon
				$('#flow .form-item.selected')?.classList.remove('selected');
				item.classList.toggle('selected');

				// Update the button state
				updateButton();
			};
		});

		// Symptoms click
		form.$$('#symptoms .form-item').forEach(item => {
			item.onclick = e => {
				e.stopPropagation();
				navigator.vibrate?.(10);

				// Toggle the selected class
				item.classList.toggle('selected');

				// Update the button state
				updateButton();
			};
		});

		// Save button click
		form.$('.btn#save').onclick = async e => {
			e.stopPropagation();
			if (form.$('.btn#save').classList.contains('disabled')) return;
			navigator.vibrate?.(10);

			// Get the selected rates
			const flow_rate = form.$('#flow .form-item.selected')?.getAttribute('value');

			// Get the selected symptoms
			const selected_symptoms = [...form.$$('#symptoms .form-item.selected')];

			// Data structure for the period day
			const period_day = {
				date: date.toISOString().split('T')[0],
				flow: parseInt(flow_rate),
				symptoms: selected_symptoms.map(item => item.getAttribute('value'))
			};

			// Close the form
			body_class.remove('form-open');
			setTimeout(() => $('.day.selected')?.classList.remove('selected'), 200);

			// Update classes and attributes
			let day_tile = this.getDayTile(date);
			day_tile.setAttribute('user-flow', period_day.flow);

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
			setTimeout(() => $('.day.selected')?.classList.remove('selected'), 200);

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
