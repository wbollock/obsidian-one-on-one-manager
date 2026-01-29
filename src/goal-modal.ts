// ABOUTME: Modal for creating and editing goals for direct reports
// ABOUTME: Provides structured input for goal details, key results, and timeline
import {App, Modal, Notice, Setting} from 'obsidian';
import OneOnOneManager from './main';
import {Goal, KeyResult} from './types';
import {GoalsManager} from './goals-manager';

export class GoalModal extends Modal {
	plugin: OneOnOneManager;
	goalsManager: GoalsManager;
	goal: Goal | null;
	person: string;
	onSave: (goal: Goal) => void;

	// Form fields
	title: string = '';
	description: string = '';
	category: Goal['category'] = 'Performance';
	timeframe: Goal['timeframe'] = 'Q1';
	year: number = new Date().getFullYear();
	startDate: string = '';
	targetDate: string = '';
	keyResults: KeyResult[] = [];

	constructor(app: App, plugin: OneOnOneManager, person: string, goal: Goal | null, onSave: (goal: Goal) => void) {
		super(app);
		this.plugin = plugin;
		this.goalsManager = new GoalsManager(app, plugin.settings);
		this.person = person;
		this.goal = goal;
		this.onSave = onSave;

		// Pre-fill if editing
		if (goal) {
			this.title = goal.title;
			this.description = goal.description;
			this.category = goal.category;
			this.timeframe = goal.timeframe;
			this.year = goal.year;
			this.startDate = goal.startDate;
			this.targetDate = goal.targetDate;
			this.keyResults = goal.keyResults || [];
		} else {
			// Default dates
			const today = new Date();
			this.year = today.getFullYear();
			this.startDate = today.toISOString().split('T')[0] || '';
			
			// Default to end of quarter
			const quarterEnd = this.getQuarterEnd(today);
			this.targetDate = quarterEnd.toISOString().split('T')[0] || '';
		}
	}

	private getQuarterEnd(date: Date): Date {
		const month = date.getMonth();
		const year = date.getFullYear();
		const quarterMonth = Math.floor(month / 3) * 3 + 2; // 2, 5, 8, 11
		return new Date(year, quarterMonth + 1, 0); // Last day of quarter month
	}

	onOpen(): void {
		const {contentEl} = this;
		contentEl.empty();
		contentEl.addClass('one-on-one-modal');
		contentEl.addClass('goal-modal');

		const title = this.goal ? `Edit Goal for ${this.person}` : `New Goal for ${this.person}`;
		contentEl.createEl('h2', {text: title});

		const form = contentEl.createEl('div', {cls: 'goal-form'});

		// Title field
		new Setting(form)
			.setName('Goal title')
			.setDesc('A clear, concise title for this goal')
			.addText(text => text
				.setPlaceholder('e.g., Lead the API redesign project')
				.setValue(this.title)
				.onChange(value => this.title = value)
			);

		// Description
		new Setting(form)
			.setName('Description')
			.setDesc('What does success look like? Be specific.')
			.addTextArea(text => {
				text.setPlaceholder('Describe the goal in detail...')
					.setValue(this.description)
					.onChange(value => this.description = value);
				text.inputEl.rows = 4;
				text.inputEl.style.width = '100%';
			});

		// Category
		new Setting(form)
			.setName('Category')
			.setDesc('What type of goal is this?')
			.addDropdown(dropdown => dropdown
				.addOption('Career', 'Career Growth')
				.addOption('Technical', 'Technical Skill')
				.addOption('Project', 'Project/Delivery')
				.addOption('Performance', 'Performance/Impact')
				.addOption('Learning', 'Learning/Development')
				.addOption('Team', 'Team/Collaboration')
				.addOption('Personal', 'Personal Development')
				.setValue(this.category)
				.onChange(value => this.category = value as Goal['category'])
			);

		// Timeframe
		new Setting(form)
			.setName('Timeframe')
			.setDesc('When should this goal be achieved?')
			.addDropdown(dropdown => dropdown
				.addOption('Q1', 'Q1 (Jan-Mar)')
				.addOption('Q2', 'Q2 (Apr-Jun)')
				.addOption('Q3', 'Q3 (Jul-Sep)')
				.addOption('Q4', 'Q4 (Oct-Dec)')
				.addOption('6-month', '6 Months')
				.addOption('Annual', 'Annual')
				.addOption('Custom', 'Custom')
				.setValue(this.timeframe)
				.onChange(value => this.timeframe = value as Goal['timeframe'])
			);

		// Year selector
		new Setting(form)
			.setName('Year')
			.setDesc('Which year does this goal belong to?')
			.addDropdown(dropdown => {
				const currentYear = new Date().getFullYear();
				// Show current year, next year, and previous year
				for (let year = currentYear - 1; year <= currentYear + 1; year++) {
					dropdown.addOption(year.toString(), year.toString());
				}
				dropdown.setValue(this.year.toString());
				dropdown.onChange(value => this.year = parseInt(value));
				return dropdown;
			});

		// Start date
		new Setting(form)
			.setName('Start date')
			.addText(text => text
				.setPlaceholder('YYYY-MM-DD')
				.setValue(this.startDate)
				.onChange(value => this.startDate = value)
			).then(setting => {
				setting.controlEl.querySelector('input')?.setAttribute('type', 'date');
			});

		// Target date
		new Setting(form)
			.setName('Target date')
			.setDesc('When should this goal be completed?')
			.addText(text => text
				.setPlaceholder('YYYY-MM-DD')
				.setValue(this.targetDate)
				.onChange(value => this.targetDate = value)
			).then(setting => {
				setting.controlEl.querySelector('input')?.setAttribute('type', 'date');
			});

		// Key Results section
		const krSection = form.createEl('div', {cls: 'key-results-section'});
		krSection.createEl('h3', {text: 'Key Results (Optional)'});
		krSection.createEl('p', {
			text: 'Break this goal into measurable key results',
			cls: 'setting-item-description'
		});

		const krList = krSection.createEl('div', {cls: 'key-results-list'});
		this.renderKeyResults(krList);

		const addKrBtn = krSection.createEl('button', {
			text: '+ Add Key Result',
			cls: 'add-key-result-btn'
		});
		addKrBtn.addEventListener('click', () => {
			this.keyResults.push({
				id: this.goalsManager.generateId(),
				description: '',
				target: '',
				current: '',
				completed: false
			});
			this.renderKeyResults(krList);
		});

		// Buttons
		const buttonDiv = form.createEl('div', {cls: 'modal-button-container'});
		
		const saveBtn = buttonDiv.createEl('button', {
			text: this.goal ? 'Save Changes' : 'Create Goal',
			cls: 'mod-cta'
		});
		saveBtn.addEventListener('click', () => this.handleSave());

		const cancelBtn = buttonDiv.createEl('button', {text: 'Cancel'});
		cancelBtn.addEventListener('click', () => this.close());
	}

	private renderKeyResults(container: HTMLElement): void {
		container.empty();

		if (this.keyResults.length === 0) {
			container.createEl('p', {
				text: 'No key results yet. Add one to track measurable outcomes.',
				cls: 'empty-state-text'
			});
			return;
		}

		this.keyResults.forEach((kr, index) => {
			const krItem = container.createEl('div', {cls: 'key-result-item'});

			const krHeader = krItem.createEl('div', {cls: 'key-result-header'});
			krHeader.createEl('span', {text: `Key Result ${index + 1}`, cls: 'key-result-label'});
			
			const deleteBtn = krHeader.createEl('button', {text: '×', cls: 'delete-kr-btn'});
			deleteBtn.addEventListener('click', () => {
				this.keyResults.splice(index, 1);
				this.renderKeyResults(container);
			});

			// Description
			const descInput = krItem.createEl('input', {
				type: 'text',
				placeholder: 'e.g., Complete 3 code reviews per week',
				cls: 'key-result-description'
			});
			descInput.value = kr.description;
			descInput.addEventListener('input', () => {
				kr.description = descInput.value;
			});

			// Metrics row
			const metricsRow = krItem.createEl('div', {cls: 'key-result-metrics'});
			
			const currentInput = metricsRow.createEl('input', {
				type: 'text',
				placeholder: 'Current',
				cls: 'key-result-input'
			});
			currentInput.value = kr.current;
			currentInput.addEventListener('input', () => {
				kr.current = currentInput.value;
			});

			metricsRow.createEl('span', {text: '/', cls: 'metric-separator'});

			const targetInput = metricsRow.createEl('input', {
				type: 'text',
				placeholder: 'Target',
				cls: 'key-result-input'
			});
			targetInput.value = kr.target;
			targetInput.addEventListener('input', () => {
				kr.target = targetInput.value;
			});

			// Unit/notes
			const unitInput = metricsRow.createEl('input', {
				type: 'text',
				placeholder: 'unit (optional)',
				cls: 'key-result-unit'
			});
			unitInput.value = kr.unit || '';
			unitInput.addEventListener('input', () => {
				kr.unit = unitInput.value;
			});
		});
	}

	private async handleSave(): Promise<void> {
		// Validation
		if (!this.title.trim()) {
			new Notice('⚠️ Please enter a goal title', 3000);
			return;
		}

		if (!this.description.trim()) {
			new Notice('⚠️ Please enter a goal description', 3000);
			return;
		}

		if (!this.startDate) {
			new Notice('⚠️ Please select a start date', 3000);
			return;
		}

		if (!this.targetDate) {
			new Notice('⚠️ Please select a target date', 3000);
			return;
		}

		// Validate dates
		const start = new Date(this.startDate);
		const target = new Date(this.targetDate);
		if (target <= start) {
			new Notice('⚠️ Target date must be after start date', 3000);
			return;
		}

		// Create or update goal
		const goal: Goal = {
			id: this.goal?.id || this.goalsManager.generateId(),
			person: this.person,
			title: this.title.trim(),
			description: this.description.trim(),
			category: this.category,
			timeframe: this.timeframe,
			year: this.year,
			startDate: this.startDate,
			targetDate: this.targetDate,
			status: this.goal?.status || 'not-started',
			progress: this.goal?.progress || 0,
			keyResults: this.keyResults.filter(kr => kr.description.trim().length > 0),
			checkIns: this.goal?.checkIns || [],
			blockers: this.goal?.blockers || [],
			supportNeeded: this.goal?.supportNeeded,
			successCriteria: this.goal?.successCriteria || [],
			tags: this.goal?.tags || [],
			archived: this.goal?.archived || false
		};

		try {
			await this.goalsManager.saveGoal(this.person, goal);
			this.onSave(goal);
			this.close();
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Unknown error';
			new Notice(`❌ Error saving goal: ${message}`, 5000);
		}
	}

	onClose(): void {
		const {contentEl} = this;
		contentEl.empty();
	}
}
