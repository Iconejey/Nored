class MenuPage extends CustomElement {
	constructor() {
		super();
		this.classList.add('page');

		this.whenReady(async () => {
			this.innerHTML = html`
				<span id="menu-back" class="icon">arrow_forward</span>
				<account-panel />
			`;

			// Close menu on back button click
			this.$('#menu-back').onclick = async e => {
				e.stopPropagation();
				if (!userSignedIn()) return alert('Veuillez vous connecter pour accéder à Nored.');
				body_class.remove('menu');
				await delay(300);
				navigator.vibrate?.(10);
			};
		});
	}
}

defineComponent(html`<menu-page />`);
