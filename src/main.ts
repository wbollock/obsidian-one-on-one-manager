// ABOUTME: Main plugin entry point for 1:1 Manager
// ABOUTME: Registers commands, views, and handles plugin lifecycle
import {Plugin, WorkspaceLeaf, Notice, Modal} from 'obsidian';
import {DEFAULT_SETTINGS, OneOnOneSettings, OneOnOneSettingTab} from "./settings";
import {DashboardView, DASHBOARD_VIEW_TYPE} from './dashboard-view';
import {TimelineView, TIMELINE_VIEW_TYPE} from './timeline-view';
import {CoachingPlanView, COACHING_PLAN_VIEW_TYPE} from './coaching-plan-view';
import {GoalsView, GOALS_VIEW_TYPE} from './goals-view';
import {CreateMeetingModal} from './create-meeting-modal';
import {PersonProfileModal} from './person-profile-modal';
import {GoalModal} from './goal-modal';
import {AgendaItemModal} from './agenda-item-modal';
import {PeopleManager} from './people-manager';
import {GoalsManager} from './goals-manager';

export default class OneOnOneManager extends Plugin {
	settings: OneOnOneSettings;
	peopleManager: PeopleManager;
	goalsManager: GoalsManager;
	settingTab: OneOnOneSettingTab;

	async onload() {
		await this.loadSettings();
		
		this.peopleManager = new PeopleManager(this.app, this.settings);
		this.goalsManager = new GoalsManager(this.app, this.settings);

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

		this.registerView(
			GOALS_VIEW_TYPE,
			(leaf) => new GoalsView(leaf, this, '')
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

		this.addCommand({
			id: 'edit-meeting-template',
			name: 'Edit 1:1 Meeting Template',
			callback: async () => {
				await this.settingTab.openTemplateInNote();
				new Notice('Template opened for editing. Save and use "Load from Note" in settings to apply changes.');
			}
		});

		this.addCommand({
			id: 'add-agenda-item',
			name: 'Add Agenda Item for Next 1:1',
			callback: async () => {
				const people = await this.peopleManager.getAllPeople();
				if (people.length === 0) {
					new Notice('No people found. Add a person profile first.');
					return;
				}
				
				// For now, show a simple suggester to pick the person
				const personNames = people.map(p => p.name);
				
				// Create a simple modal to select person
				const modal = new Modal(this.app);
				modal.titleEl.setText('Select person for agenda item');
				
				const select = modal.contentEl.createEl('select', {cls: 'agenda-person-select'});
				select.style.width = '100%';
				select.style.padding = '10px';
				select.style.marginBottom = '15px';
				select.style.fontSize = '1em';
				
				for (const name of personNames) {
					select.createEl('option', {value: name, text: name});
				}
				
				const btn = modal.contentEl.createEl('button', {text: 'Continue', cls: 'mod-cta'});
				btn.style.width = '100%';
				btn.style.padding = '10px';
				
				btn.addEventListener('click', () => {
					const selectedPerson = select.value;
					modal.close();
					new AgendaItemModal(this.app, this, selectedPerson, (newItem) => {
						// Refresh dashboard if open
						const dashboardLeaves = this.app.workspace.getLeavesOfType(DASHBOARD_VIEW_TYPE);
						if (dashboardLeaves.length > 0 && dashboardLeaves[0]) {
							const view = dashboardLeaves[0].view as DashboardView;
							view.render();
						}
					}).open();
				});
				
				modal.open();
			}
		});

		this.settingTab = new OneOnOneSettingTab(this.app, this);
		this.addSettingTab(this.settingTab);
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

	async openGoalsView(person: string): Promise<void> {
		const leaf = this.app.workspace.getLeaf('tab');
		if (leaf) {
			const view = new GoalsView(leaf, this, person);
			await leaf.open(view);
		}
	}

	onunload() {
		this.app.workspace.detachLeavesOfType(DASHBOARD_VIEW_TYPE);
		this.app.workspace.detachLeavesOfType(TIMELINE_VIEW_TYPE);
		this.app.workspace.detachLeavesOfType(COACHING_PLAN_VIEW_TYPE);
		this.app.workspace.detachLeavesOfType(GOALS_VIEW_TYPE);
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData() as Partial<OneOnOneSettings>);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
