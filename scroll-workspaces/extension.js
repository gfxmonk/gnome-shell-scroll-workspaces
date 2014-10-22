const Clutter = imports.gi.Clutter;
const Shell = imports.gi.Shell;
const Lang = imports.lang;

const Main = imports.ui.main;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Prefs = Me.imports.prefs;

const WorkspaceScroller = new Lang.Class({
	Name: 'WorkspaceScroller',

	_init: function() {
		Main.panel.actor.reactive = true;
		this._panelScrollEventId = Main.panel.actor.connect('scroll-event', Lang.bind(this, this._onScrollEvent));
		this._lastScrollTime = new Date().getTime();
		this._settings = Prefs.loadSettings();
	},

	destroy: function() {
		if (this._panelScrollEventId) {
			Main.panel.actor.disconnect(this._panelScrollEventId);
			this._panelScrollEventId = 0;
		}
	},

	get _delay() {
		return this._settings.get_int('scroll-delay');
	},
	get _noLast() {
		return this._settings.get_boolean('ignore-last-workspace');
	},

	_activate : function(index) {
		let off = 0;
		if (this._noLast) {
			off = 1;
		}
		if (index >= 0 && index < global.screen.n_workspaces - off) {
			let metaWorkspace = global.screen.get_workspace_by_index(index);
			metaWorkspace.activate(global.get_current_time());
		}
	},

	_onScrollEvent : function(actor, event) {
		let source = event.get_source();
		if (source.__proto__ != Shell.GenericContainer.prototype) {
			// Actors in the "status" area may have their own scroll events
			return;
		}

		let direction = event.get_scroll_direction();
		let diff = 0;
		if (direction == Clutter.ScrollDirection.DOWN) {
			diff = 1;
		} else if (direction == Clutter.ScrollDirection.UP) {
			diff = -1;
		} else {
			return;
		}

		let currentTime = new Date().getTime();
		if (currentTime < this._lastScrollTime + this._delay) {
			// Ensure a minimum delay between workspace scrolls
			return;
		}
		this._lastScrollTime = currentTime;

		let newIndex = global.screen.get_active_workspace().index() + diff;
		this._activate(newIndex);
	}
});

function init(meta) {
	/* do nothing */
}

let _scroller;

function enable() {
	_scroller = new WorkspaceScroller;
}

function disable() {
	_scroller.destroy();
}
