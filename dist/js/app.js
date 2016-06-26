'use strict';

let util, userManager, observer;

class Utils {
	elt(el, text, ...rest) {
		el = document.createElement(el);
		el.appendChild(document.createTextNode(text));
		rest.forEach(item => {
			el.classList.add(item);
		});
		return el;
	}

	append(parent, ...items) {
		items.forEach(item => {
			parent.appendChild(item);
		});
	}

	ageGrowSort() {
		return (a, b) => a.age - b.age;
	}

	ageFallSort() {
		return (a, b) => b.age - a.age;
	}

	alhabeticalSort() {
		return (a, b) => {
			if (a.name > b.name) return 1;
			if (a.name < b.name) return -1;
			return 0;
		};
	}

	nonAlhabeticalSort() {
		return (a, b) => {
			if (a.name > b.name) return -1;
			if (a.name < b.name) return 1;
			return 0;
		};
	}
}

class User {
	constructor(opts) {
		this.id         = opts.id;
		this.name       = opts.name;
		this.age        = opts.age;
		this.phone      = opts.phone;
		this.image      = opts.image;
		this.phrase     = opts.phrase;
		this.animal     = opts.animal;
	}
}

class UserManager {
	constructor() {
		this.usersStore = [];
		this.tempUsersStore = [];
		this.currentFilter = 'alphabet';
		this.filterControllers = {
			'alphabet' : 'alhabeticalSort',
			'non-alphabet': 'nonAlhabeticalSort',
			'age-grow': 'ageGrowSort',
			'age-fall': 'ageFallSort'
		};
		this.sortStatesStep = {
			'alphabet': 'non-alphabet',
			'non-alphabet': 'alphabet',
			'age-grow': 'age-fall',
			'age-fall': 'age-grow'
		};
	}

	getNextFilterState(current) {
		return this.sortStatesStep[current];
	}

	changeSortFilter(filter) {
		this.currentFilter = filter;
	}

	sortUsers(nextState) {
		this.changeSortFilter(nextState);
		let sortedMethod = util[ this.filterControllers[this.currentFilter] ];
		this.tempUsersStore = this.tempUsersStore.sort( sortedMethod() );
		return this.tempUsersStore;
	}

	createUser(userData) {
		this.usersStore.push( new User(userData) );
		this.tempUsersStore.push( new User(userData) );
	}

	getUsersCount() {
		return this.usersStore.length;
	}

	findById(id) {
		return this.usersStore.filter(user => user.id == id).pop();
	}

	searchByName(phrase) {
		this.tempUsersStore = this.usersStore.filter(user => user.name.indexOf(phrase) !== -1);
		return this.tempUsersStore;
	}

	changeBarComponentView(user) {
		observer.publish('onUserListItemClick', user);
	}

	changeUserListComponentView(data) {
		observer.publish('onUserSearchInput', data);
	}
}

class Observer {
	constructor() {
		this.subscribers = {};
	}

	subscribe(event, fn) {
		if ( !this.subscribers[event] ) {
			this.subscribers[event] = [];
			this.subscribers[event].push(fn);
		}
	}

	publish(event, data) {
		if (this.subscribers[event]) {
			this.subscribers[event].forEach(fn => {
				fn(data);
			});
		}
	}
}

class UserData {
	constructor(data) {
		this.data = data;
	}

	render(...rest) {
		let initedComponents = rest.map(component => component.init());
		let userDataComponent = util.elt('div', '', 'user-data', 'component');
		util.append(userDataComponent, ...initedComponents);
		return userDataComponent;
	}

	init() {
		let data = this.data;
		let userDataComponent = this.render(new UserList(data), new UserBar(data[0]));
		console.log('userDataComponent is render');
		return userDataComponent;
	}
}

class App {
	render(data) {
		let AppContainer = document.querySelector('#appContainer');
		AppContainer.addEventListener('click', this.clickHandler, false);
		AppContainer.addEventListener('input', this.inputHandler, false);
		util.append(AppContainer, new SearchBar().init(), new ToolBar().init(), new UserData(data).init());
	}

	sendAjax() {
		return new Promise((res, rej) => {
			let xhr = new XMLHttpRequest();
			xhr.open('GET', 'userData', true);
			xhr.send();

			xhr.onload = () => {
				if (xhr.status !== 200) {
					console.log(xhr.statusText);
				} else {
					res(JSON.parse(xhr.responseText));
				}
			};

			xhr.onerror = rej;
		});

	}

	clickHandler(e) {
		let target = e.target;
		let elem = target.closest('[data-user-id]');
		let sortTool = target.closest('[data-sort-state]');
		let user;

		if (elem) {
			user = userManager.findById( elem.dataset.userId );
			userManager.changeBarComponentView(user);
		}

		if (sortTool) {
			let currentState = sortTool.dataset.sortState,
					nextState = userManager.getNextFilterState(currentState);
			let userData = userManager.sortUsers(nextState);
			userManager.changeUserListComponentView(userData);
			sortTool.dataset.sortState = nextState;
		}
	}

	inputHandler(e) {
		let target = e.target;
		let elem = target.closest('[data-search-input]');
		let userData;
		if (elem) {
			userData = userManager.searchByName(e.target.value);
			userManager.changeUserListComponentView(userData);
		}
	}

	init() {
		util = new Utils();
		userManager = new UserManager();
		observer = new Observer();
		this.sendAjax()
			.then(data => {
				this.render(data);
				console.log('App component render');
			})
			.catch(console.log);
	}

}

class UserList {
	constructor(data) {
		this.data = data;
	}

	render(userData) {
		let data = userData || this.data;
		let userListComponent = util.elt('div', '', 'user-list', 'component');
		let ul = util.elt('ul', '', 'user-list__list');
		data.forEach(user => {
			let userRowComponent = new UserRow(user).init();
			ul.appendChild(userRowComponent);
		});

		if (userData) {
			this.getDOMComponentNode().innerHTML = '';
			this.getDOMComponentNode().appendChild(ul);
		} else {
			userListComponent.appendChild(ul);
		}

		return userListComponent;
	}

	getDOMComponentNode() {
		return document.querySelector('.user-list');
	}

	init() {
		observer.subscribe('onUserSearchInput', this.render.bind(this));
		let userListComponent = this.render();
		console.log('UserList component render');
		return userListComponent;
	}
}

class UserRow {
	constructor(data) {
		this.data = data;
	}

	render() {
		let user = this.data;
		let userRowComponent = util.elt('div', '', 'user-list__item', 'user');
		userRowComponent.setAttribute('data-user-id', user.id);
		let rowInnerHTML = `
			<div class="user__image">${user.image}</div>
			<div class="user__name">${user.name}</div>
			<div class="user__age">${user.age}</div>
			<div class="user__phone">${user.phone}</div>
		`;
		userRowComponent.innerHTML = rowInnerHTML;
		return userRowComponent;
	}

	init() {
		if ( !userManager.findById(this.data.id) ) {
			userManager.createUser(this.data);
		}
		let userRowComponent = this.render();
		return userRowComponent;
	}
}

class UserBar {
	constructor(data) {
		this.data = data;
	}

	render(userData) {
		let data = userData || this.data;
		let userBarComponent = util.elt('div', '', 'user-bar', 'component');
		let sidebarHTML = `
			<div class="user-bar__image"></div>
			<ul class="user-bar__list">
				<li class="user-bar__item user-name">
					<div class="user-name__title">Name</div>
					<div class="user-name__value">${data.name}</div>
				</li>
				<li class="user-bar__item user-phone">
					<div class="user-phone__title">Phone</div>
					<div class="user-phone__value">${data.phone}</div>
				</li>
				<li class="user-bar__item user-animal">
					<div class="user-animal__title">Animal</div>
					<div class="user-animal__value">${data.animal}</div>
				</li>
			</ul>
			<div class="user-bar__phrase">${data.phrase}</div>
		`;

		if (userData) {
			this.getDOMComponentNode().innerHTML = sidebarHTML;
		} else{
			userBarComponent.innerHTML = sidebarHTML;
		}

		return userBarComponent;
	}

	getDOMComponentNode() {
		return document.querySelector('.user-bar');
	}

	init() {
		observer.subscribe('onUserListItemClick', this.render.bind(this) );
		let userBarComponent = this.render();
		console.log('UserBar component render');
		return userBarComponent;
	}
}

class SearchBar {
	constructor() {}

	render() {
		let searchBarComponent = util.elt('div', '', 'search-bar', 'component');
		let searchInput = `
			<input class="search-input" type="text" data-search-input="true" placeholder="John Snow" autocomplete="off" tabindex="1" />
		`;
		searchBarComponent.innerHTML = searchInput;
		return searchBarComponent;
	}

	init() {
		let searchBarComponent = this.render();
		console.log('searchBar component render');
		return searchBarComponent;
	}
}

class ToolBar {
	constructor(){}

	render() {
		let toolBarComponent = util.elt('div', '', 'user-tool', 'component');
		util.append(toolBarComponent, new AlphabetSortTool().init(), new AgeSortTool().init());
		return toolBarComponent;
	}

	init() {
		let toolBarComponent = this.render();
		console.log('toolbar component render');
		return toolBarComponent;
	}
}

class AlphabetSortTool {
	constructor() {}
	
	render() {
		let toolComponent = util.elt('div', '', 'alphabet-sort__item', 'tool');
		let html = `
			<input type="checkbox" id="alphabet-sort-input" class="tool__input hide" />
			<label data-sort-state="alphabet" data-sort-role="true" for="alphabet-sort-input" class="tool__label"></label>
			<div class="tool__title">Sort in alphabel order</div>
		`;
		toolComponent.innerHTML = html;
		return toolComponent;
	}

	init() {
		return this.render();
	}
}

class AgeSortTool {
	constructor() {}

	render() {
		let toolComponent = util.elt('div', '', 'age-sort__item', 'tool');
		let html = `
			<input type="checkbox" id="age-sort-input" class="tool__input hide" />
			<label data-sort-state="age-grow" data-sort-role="true" for="age-sort-input" class="tool__label"></label>
			<div class="tool__title">Sort in age order</div>
		`;
		toolComponent.innerHTML = html;
		return toolComponent;
	}

	init() {
		return this.render();
	}
}

new App().init();