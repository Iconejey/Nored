class AnalysisPage extends CustomElement {
	constructor() {
		super();
		this.classList.add('page');

		this.whenReady(async () => {
			this.innerHTML = html`
				<span id="analysis-back" class="icon">arrow_back</span>
				<p style="color: var(--yellow);">Fonctionnalité en cours de développement.</p>
			`;

			// Close analysis on back button click
			this.$('#analysis-back').onclick = async e => {
				e.stopPropagation();
				body_class.remove('analysis');
				await delay(300);
				navigator.vibrate?.(10);
			};
		});
	}
}

defineComponent(html`<analysis-page />`);
