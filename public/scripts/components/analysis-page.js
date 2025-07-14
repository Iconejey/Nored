class AnalysisPage extends CustomElement {
	constructor() {
		super();
		this.classList.add('page');

		this.whenReady(async () => {
			const week_days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
			const months = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
			const date = new Date();
			const formatted_date = `${week_days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;

			this.innerHTML = html`
				<header>
					<span id="analysis-back" class="icon">arrow_back</span>
					<span id="analysis-date">${formatted_date}</span>
					<span id="analysis-again" class="icon ">autorenew</span>
				</header>

				<div id="analysis-clock">
					<svg width="100%" height="100%" class="circular-progress">
						<circle class="bg"></circle>
						<circle class="fg"></circle>
					</svg>
					<div class="clock-content">
						<span class="clock-day-text">Jour du cycle</span>
						<span class="clock-day-val">...</span>
						<span class="clock-period">...</span>
						<span class="clock-pregnancy">...</span>
					</div>
				</div>

				<div class="analysis-container" id="analysis-phase-container">
					<h3>Phase <span class="analysis-phase">...</span></h3>
				</div>

				<div class="analysis-container" id="cycle-analysis-container">
					<h3>Analyse du cycle</h3>
				</div>

				<div class="analysis-container">
					<p class="analysis-info">Cette analyse a été générée par l'IA avec les données que vous avez entrées. Elle n'est pas parfaite, ne vaud pas un avis médical et peut contenir des erreurs.</p>
				</div>
			`;

			// Close analysis on back button click
			this.$('#analysis-back').onclick = async e => {
				e.stopPropagation();
				body_class.remove('analysis');
				await delay(300);
				navigator.vibrate?.(10);
			};

			// Re-analyze data on re-analyze button click
			this.$('#analysis-again').onclick = async e => {
				e.stopPropagation();
				localStorage.removeItem('ai-analysis');
				localStorage.removeItem('ai-analysis-date');
				body_class.remove('analysis');
				await delay(300);
				navigator.vibrate?.(10);
				location.reload();
			};
		});
	}
}

defineComponent(html`<analysis-page />`);
