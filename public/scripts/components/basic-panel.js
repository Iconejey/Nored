// A basic panel super class
class BasicPanel extends CustomElement {
	static get observedAttributes() {
		return ['icon', 'accent'];
	}

	// Update icon on attribute change
	onIconChange() {
		this.$('.main.icon').innerText = this.icon;
	}

	// Update label on attribute change
	set label(value) {
		this.$('.label').innerText = value.trim() || 'Sans titre';
	}

	// Make main icon spin
	set spin(value) {
		this.$('.main.icon').classList.toggle('spin', value);
	}

	constructor() {
		super();

		this.whenReady(() => {
			this.innerHTML = html`
				<span class="main icon"></span>
				<span class="label">${this.innerText}</span>
			`;

			this.classList.add('panel');
			// this.tabIndex = 1;
			this.addEventListener('click', () => app.vibrate());
		});
	}
}

defineComponent(html`<basic-panel icon accent />`);
