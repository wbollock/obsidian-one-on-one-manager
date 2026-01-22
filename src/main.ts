// ABOUTME: Main plugin entry point for 1:1 Manager
// ABOUTME: Registers commands, views, and handles plugin lifecycle
import {Plugin, WorkspaceLeaf} from 'obsidian';
import {DEFAULT_SETTINGS, OneOnOneSettings, OneOnOneSettingTab} from "./settings";
import {DashboardView, DASHBOARD_VIEW_TYPE} from './dashboard-view';
import {TimelineView, TIMELINE_VIEW_TYPE} from './timeline-view';
import {CoachingPlanView, COACHING_PLAN_VIEW_TYPE} from './coaching-plan-view';
import {CreateMeetingModal} from './create-meeting-modal';
import {PersonProfileModal} from './person-profile-modal';
import {PeopleManager} from './people-manager';

export default class OneOnOneManager extends Plugin {
	settings: OneOnOneSettings;
	peopleManager: PeopleManager;

	async onload() {
		await this.loadSettings();
		
		this.peopleManager = new PeopleManager(this.app, this.settings);

		this.registerView(
			DASHBOARD_VIEW_TYPE,
			(leaf) => new DashboardView(leaf, this)
		);

		this.registerView(
			TIMELINE_VIEW_TYPE,
			(leaf) => new TimelineView(leaf, this, '')
		);

		this.registerView(
			COACHING_PLAN_VIEW_TYPE,
			(leaf) => new CoachingPlanView(leaf, this, '')
		);

		this.addRibbonIcon('users', 'Open 1:1 Dashboard', () => {
			this.openDashboard();
		});

		this.addCommand({
			id: 'create-one-on-one',
			name: 'Create 1:1 Meeting Note',
			callback: () => {
				new CreateMeetingModal(this.app, this).open();
			}
		});

		this.addCommand({
			id: 'add-person',
			name: 'Add Person Profile',
			callback: () => {
				new PersonProfileModal(this.app, this, null, async (profile) => {
					await this.peopleManager.savePersonProfile(profile);
				}).open();
			}
		});

		this.addCommand({
			id: 'open-dashboard',
			name: 'Open Dashboard',
			callback: () => {
				this.openDashboard();
			}
		});

		this.addSettingTab(new OneOnOneSettingTab(this.app, this));
	}

	async openDashboard(): Promise<void> {
		const existing = this.app.workspace.getLeavesOfType(DASHBOARD_VIEW_TYPE);
		
		if (existing.length > 0 && existing[0]) {
			this.app.workspace.revealLeaf(existing[0]);
			return;
		}

		const leaf = this.app.workspace.getRightLeaf(false);
		if (!leaf) return;
		
		await leaf.setViewState({
			type: DASHBOARD_VIEW_TYPE,
			active: true
		});
		this.app.workspace.revealLeaf(leaf);
	}

	async openTimelineView(person: string): Promise<void> {
		const leaf = this.app.workspace.getLeaf('tab');
		if (leaf) {
			const view = new TimelineView(leaf, this, person);
			await leaf.open(view);
		}
	}

	async openCoachingPlanView(person: string): Promise<void> {
		const leaf = this.app.workspace.getLeaf('tab');
		if (leaf) {
			const view = new CoachingPlanView(leaf, this, person);
			await leaf.open(view);
		}
	}

	onunload() {
		this.app.workspace.detachLeavesOfType(DASHBOARD_VIEW_TYPE);
		this.app.workspace.detachLeavesOfType(TIMELINE_VIEW_TYPE);
		this.app.workspace.detachLeavesOfType(COACHING_PLAN_VIEW_TYPE);
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData() as Partial<OneOnOneSettings>);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
