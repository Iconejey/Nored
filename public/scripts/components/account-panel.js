// Account panel component
class AccountPanel extends CustomElement {
	constructor() {
		super();

		// Wait for DOM to be ready
		this.whenReady(() => {
			// Set the inner HTML
			this.innerHTML = html`
				<div class="account-circle"></div>
				<div class="account-info">
					<span class="account-name">Nothing</span>
					<span class="account-email">Sign in or up</span>
				</div>
			`;

			// Add classes
			this.classList.add('panel', 'hoverable');

			// Sign in on click
			this.onclick = () => authenticate(true);

			// If already signed in
			if (userSignedIn()) this.authDone();
		});
	}

	// Update the account panel
	async authDone() {
		// Get account info
		const info = await getAccountInfo(localStorage.getItem('token'));

		this.name = info.name;
		this.email = info.email;
		const initials = this.name
			.split(' ')
			.slice(0, 2)
			.map(word => word[0])
			.join('')
			.toUpperCase();

		// Set the inner HTML
		this.innerHTML = html`
			<div class="account-circle">${initials}</div>
			<div class="account-info">
				<span class="account-name">${this.name}</span>
				<span class="account-email">${this.email}</span>
			</div>
		`;

		// Sign out on context menu
		this.oncontextmenu = e => {
			e.preventDefault();
			if (confirm('Voulez-vous vraiment vous déconnecter ?')) signOut();
		};
	}
}

defineComponent(html`<account-panel />`);
