// ABOUTME: Service for managing goals and OKRs for direct reports
// ABOUTME: Handles CRUD operations, check-ins, and progress tracking
import {App, TFile, Notice} from 'obsidian';
import {Goal, GoalCheckIn, KeyResult} from './types';
import {OneOnOneSettings} from './settings';

export class GoalsManager {
	constructor(private app: App, private settings: OneOnOneSettings) {}

	/**
	 * Get all goals for a specific person (optionally filtered by year)
	 */
	async getPersonGoals(person: string, year?: number): Promise<Goal[]> {
		const goalsFile = await this.getOrCreateGoalsFile(person);
		if (!goalsFile) return [];

		try {
			const content = await this.app.vault.read(goalsFile);
			const cache = this.app.metadataCache.getFileCache(goalsFile);
			
			if (!cache?.frontmatter?.goals) return [];
			
			const goalsData = cache.frontmatter.goals;
			let goals = Array.isArray(goalsData) ? goalsData : [];
			
			// Filter by year if specified
			if (year !== undefined) {
				goals = goals.filter(g => g.year === year);
			}
			
			return goals;
		} catch (error) {
			console.error(`Error reading goals for ${person}:`, error);
			new Notice(`❌ Error loading goals for ${person}`);
			return [];
		}
	}

	/**
	 * Get goals for current year only (most common use case)
	 */
	async getCurrentYearGoals(person: string): Promise<Goal[]> {
		const currentYear = new Date().getFullYear();
		return this.getPersonGoals(person, currentYear);
	}

	/**
	 * Get archived goals from previous years
	 */
	async getArchivedGoals(person: string): Promise<Goal[]> {
		const allGoals = await this.getPersonGoals(person);
		const currentYear = new Date().getFullYear();
		return allGoals.filter(g => g.year < currentYear || g.archived);
	}

	/**
	 * Get all years that have goals for a person
	 */
	async getGoalYears(person: string): Promise<number[]> {
		const allGoals = await this.getPersonGoals(person);
		const years = new Set(allGoals.map(g => g.year));
		return Array.from(years).sort((a, b) => b - a); // Descending order
	}

	/**
	 * Get all active goals across all people (current year only by default)
	 */
	async getAllActiveGoals(includeAllYears: boolean = false): Promise<Goal[]> {
		const goalsFolder = `${this.settings.oneOnOneFolder}/goals`;
		const files = this.app.vault.getMarkdownFiles()
			.filter(f => f.path.startsWith(goalsFolder) && f.basename !== 'index');

		const currentYear = new Date().getFullYear();
		const allGoals: Goal[] = [];
		
		for (const file of files) {
			try {
				const cache = this.app.metadataCache.getFileCache(file);
				if (cache?.frontmatter?.goals) {
					const goals: Goal[] = cache.frontmatter.goals;
					const activeGoals = goals.filter(g => {
						const isActive = g.status !== 'completed' && g.status !== 'abandoned' && !g.archived;
						const isCurrentYear = includeAllYears || g.year === currentYear;
						return isActive && isCurrentYear;
					});
					allGoals.push(...activeGoals);
				}
			} catch (error) {
				console.error(`Error reading goals from ${file.path}:`, error);
			}
		}

		return allGoals;
	}

	/**
	 * Save or update a goal for a person
	 */
	async saveGoal(person: string, goal: Goal): Promise<void> {
		const goalsFile = await this.getOrCreateGoalsFile(person);
		if (!goalsFile) {
			new Notice('❌ Could not create goals file');
			return;
		}

		try {
			const goals = await this.getPersonGoals(person);
			const existingIndex = goals.findIndex(g => g.id === goal.id);

			if (existingIndex >= 0) {
				goals[existingIndex] = goal;
			} else {
				goals.push(goal);
			}

			await this.writeGoalsToFile(goalsFile, person, goals);
			new Notice(`✅ Goal "${goal.title}" saved`);
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Unknown error';
			console.error('Error saving goal:', error);
			new Notice(`❌ Error saving goal: ${message}`);
		}
	}

	/**
	 * Add a check-in to a goal
	 */
	async addGoalCheckIn(person: string, goalId: string, checkIn: GoalCheckIn): Promise<void> {
		const goals = await this.getPersonGoals(person);
		const goal = goals.find(g => g.id === goalId);

		if (!goal) {
			new Notice(`❌ Goal not found: ${goalId}`);
			return;
		}

		goal.checkIns.push(checkIn);
		goal.progress = checkIn.progress;
		goal.status = this.deriveGoalStatus(goal, checkIn);

		await this.saveGoal(person, goal);
	}

	/**
	 * Update goal progress based on check-in
	 */
	private deriveGoalStatus(goal: Goal, checkIn: GoalCheckIn): Goal['status'] {
		if (checkIn.progress >= 100) return 'completed';
		if (checkIn.status === 'blocked') return 'at-risk';
		if (checkIn.progress > 0) return 'in-progress';
		return 'not-started';
	}

	/**
	 * Delete a goal
	 */
	async deleteGoal(person: string, goalId: string): Promise<void> {
		const goals = await this.getPersonGoals(person);
		const filteredGoals = goals.filter(g => g.id !== goalId);

		if (goals.length === filteredGoals.length) {
			new Notice(`❌ Goal not found: ${goalId}`);
			return;
		}

		const goalsFile = await this.getOrCreateGoalsFile(person);
		if (!goalsFile) return;

		await this.writeGoalsToFile(goalsFile, person, filteredGoals);
		new Notice('✅ Goal deleted');
	}

	/**
	 * Get goals that are due soon (within next 7 days)
	 */
	async getUpcomingGoals(person?: string, year?: number): Promise<Goal[]> {
		const currentYear = year || new Date().getFullYear();
		const goals = person 
			? await this.getPersonGoals(person, currentYear)
			: await this.getAllActiveGoals();

		const today = new Date();
		const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

		return goals.filter(g => {
			if (!g.targetDate || g.status === 'completed') return false;
			const targetDate = new Date(g.targetDate);
			return targetDate >= today && targetDate <= nextWeek;
		});
	}

	/**
	 * Archive goals from previous year
	 */
	async archiveYearGoals(person: string, year: number): Promise<void> {
		const goals = await this.getPersonGoals(person);
		const goalsFile = await this.getOrCreateGoalsFile(person);
		if (!goalsFile) return;

		let archiveCount = 0;
		goals.forEach(goal => {
			if (goal.year === year && !goal.archived) {
				goal.archived = true;
				archiveCount++;
			}
		});

		await this.writeGoalsToFile(goalsFile, person, goals);
		new Notice(`✅ Archived ${archiveCount} goals from ${year}`);
	}

	/**
	 * Start a new year - archive previous year's goals
	 */
	async rolloverToNewYear(person: string): Promise<void> {
		const currentYear = new Date().getFullYear();
		const previousYear = currentYear - 1;
		
		await this.archiveYearGoals(person, previousYear);
		new Notice(`✅ Ready for ${currentYear} goals!`);
	}

	/**
	 * Copy incomplete goals from previous year to current year
	 */
	async carryoverGoals(person: string, goalIds: string[]): Promise<void> {
		const goals = await this.getPersonGoals(person);
		const goalsFile = await this.getOrCreateGoalsFile(person);
		if (!goalsFile) return;

		const currentYear = new Date().getFullYear();
		let carriedCount = 0;

		for (const goalId of goalIds) {
			const originalGoal = goals.find(g => g.id === goalId);
			if (!originalGoal) continue;

			// Create a new goal for the current year
			const newGoal: Goal = {
				...originalGoal,
				id: this.generateId(),
				year: currentYear,
				startDate: `${currentYear}-01-01`,
				targetDate: `${currentYear}-12-31`,
				progress: 0,
				status: 'not-started',
				checkIns: [],
				archived: false
			};

			goals.push(newGoal);
			carriedCount++;
		}

		await this.writeGoalsToFile(goalsFile, person, goals);
		new Notice(`✅ Carried over ${carriedCount} goals to ${currentYear}`);
	}

	/**
	 * Get year-over-year comparison stats
	 */
	async getYearComparison(person: string, year1: number, year2: number): Promise<{
		year1Stats: { total: number; completed: number; avgProgress: number };
		year2Stats: { total: number; completed: number; avgProgress: number };
	}> {
		const year1Goals = await this.getPersonGoals(person, year1);
		const year2Goals = await this.getPersonGoals(person, year2);

		const calcStats = (goals: Goal[]) => ({
			total: goals.length,
			completed: goals.filter(g => g.status === 'completed').length,
			avgProgress: goals.length > 0 
				? goals.reduce((sum, g) => sum + g.progress, 0) / goals.length 
				: 0
		});

		return {
			year1Stats: calcStats(year1Goals),
			year2Stats: calcStats(year2Goals)
		};
	}

	/**
	 * Get at-risk goals (blocked or behind schedule) for current year
	 */
	async getAtRiskGoals(person?: string, year?: number): Promise<Goal[]> {
		const currentYear = year || new Date().getFullYear();
		const goals = person 
			? await this.getPersonGoals(person, currentYear)
			: await this.getAllActiveGoals();

		return goals.filter(g => {
			if (g.status === 'completed' || g.archived) return false;
			if (g.status === 'at-risk') return true;
			
			// Consider at-risk if target date is close but progress is low
			if (g.targetDate) {
				const today = new Date();
				const targetDate = new Date(g.targetDate);
				const startDate = new Date(g.startDate);
				const totalDays = Math.ceil((targetDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
				const daysRemaining = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
				
				if (daysRemaining <= 0) return true; // Overdue
				
				const expectedProgress = ((totalDays - daysRemaining) / totalDays) * 100;
				const progressGap = expectedProgress - g.progress;
				
				return progressGap > 20; // More than 20% behind expected progress
			}
			
			return false;
		});
	}

	/**
	 * Generate goal statistics for a person (current year by default)
	 */
	async getGoalStats(person: string, year?: number): Promise<{
		year: number;
		total: number;
		completed: number;
		inProgress: number;
		atRisk: number;
		avgProgress: number;
	}> {
		const currentYear = year || new Date().getFullYear();
		const goals = await this.getPersonGoals(person, currentYear);

		const stats = {
			year: currentYear,
			total: goals.filter(g => !g.archived).length,
			completed: goals.filter(g => g.status === 'completed' && !g.archived).length,
			inProgress: goals.filter(g => g.status === 'in-progress' && !g.archived).length,
			atRisk: goals.filter(g => g.status === 'at-risk' && !g.archived).length,
			avgProgress: goals.filter(g => !g.archived).length > 0 
				? goals.filter(g => !g.archived).reduce((sum, g) => sum + g.progress, 0) / goals.filter(g => !g.archived).length 
				: 0
		};

		return stats;
	}

	/**
	 * Get or create the goals file for a person
	 */
	private async getOrCreateGoalsFile(person: string): Promise<TFile | null> {
		const goalsFolder = `${this.settings.oneOnOneFolder}/goals`;
		const personSlug = person.toLowerCase().replace(/\s+/g, '-');
		const filePath = `${goalsFolder}/${personSlug}-goals.md`;

		let file = this.app.vault.getAbstractFileByPath(filePath);
		
		if (file instanceof TFile) {
			return file;
		}

		try {
			// Ensure folder exists
			const folderExists = this.app.vault.getAbstractFileByPath(goalsFolder);
			if (!folderExists) {
				await this.app.vault.createFolder(goalsFolder);
			}

			// Create initial goals file
			const initialContent = this.generateInitialGoalsContent(person);
			const newFile = await this.app.vault.create(filePath, initialContent);
			return newFile;
		} catch (error) {
			console.error(`Error creating goals file for ${person}:`, error);
			return null;
		}
	}

	/**
	 * Generate initial content for a goals file
	 */
	private generateInitialGoalsContent(person: string): string {
		return `---
person: ${person}
goals: []
---

# 🎯 Goals for ${person}

This file tracks goals and OKRs for ${person}. Goals are managed by the 1:1 Manager plugin.

## Active Goals

No goals yet. Create one from the dashboard!

---

*Last updated: ${new Date().toISOString().split('T')[0]}*
`;
	}

	/**
	 * Write goals back to file with proper formatting
	 */
	private async writeGoalsToFile(file: TFile, person: string, goals: Goal[]): Promise<void> {
		const content = `---
person: ${person}
goals:
${this.formatGoalsForFrontmatter(goals)}
---

# 🎯 Goals for ${person}

${this.formatGoalsAsMarkdown(goals)}

---

*Last updated: ${new Date().toISOString().split('T')[0]}*
`;

		await this.app.vault.modify(file, content);
	}

	/**
	 * Format goals for YAML frontmatter
	 */
	private formatGoalsForFrontmatter(goals: Goal[]): string {
		if (goals.length === 0) return '  []';

		return goals.map(goal => {
			const yaml = [
				`  - id: "${goal.id}"`,
				`    person: "${goal.person}"`,
				`    title: "${goal.title}"`,
				`    description: "${goal.description.replace(/"/g, '\\"')}"`,
				`    category: "${goal.category}"`,
				`    timeframe: "${goal.timeframe}"`,
				`    year: ${goal.year}`,
				`    startDate: "${goal.startDate}"`,
				`    targetDate: "${goal.targetDate}"`,
				`    status: "${goal.status}"`,
				`    progress: ${goal.progress}`,
				`    archived: ${goal.archived || false}`,
			];

			if (goal.keyResults && goal.keyResults.length > 0) {
				yaml.push(`    keyResults:`);
				goal.keyResults.forEach(kr => {
					yaml.push(`      - id: "${kr.id}"`);
					yaml.push(`        description: "${kr.description.replace(/"/g, '\\"')}"`);
					yaml.push(`        target: "${kr.target}"`);
					yaml.push(`        current: "${kr.current}"`);
					yaml.push(`        completed: ${kr.completed}`);
				});
			}

			if (goal.checkIns && goal.checkIns.length > 0) {
				yaml.push(`    checkIns:`);
				goal.checkIns.slice(-3).forEach(ci => { // Only store last 3 check-ins in frontmatter
					yaml.push(`      - id: "${ci.id}"`);
					yaml.push(`        date: "${ci.date}"`);
					yaml.push(`        progress: ${ci.progress}`);
					yaml.push(`        status: "${ci.status}"`);
					yaml.push(`        notes: "${ci.notes.replace(/"/g, '\\"')}"`);
				});
			}

			if (goal.blockers && goal.blockers.length > 0) {
				yaml.push(`    blockers:`);
				goal.blockers.forEach(b => yaml.push(`      - "${b.replace(/"/g, '\\"')}"`));
			}

			return yaml.join('\n');
		}).join('\n');
	}

	/**
	 * Format goals as readable markdown (grouped by year)
	 */
	private formatGoalsAsMarkdown(goals: Goal[]): string {
		if (goals.length === 0) {
			return '*No goals yet.*';
		}

		// Group goals by year
		const goalsByYear = new Map<number, Goal[]>();
		goals.forEach(goal => {
			if (!goalsByYear.has(goal.year)) {
				goalsByYear.set(goal.year, []);
			}
			goalsByYear.get(goal.year)?.push(goal);
		});

		// Sort years descending (most recent first)
		const sortedYears = Array.from(goalsByYear.keys()).sort((a, b) => b - a);

		let md = '';

		sortedYears.forEach(year => {
			const yearGoals = goalsByYear.get(year) || [];
			const activeGoals = yearGoals.filter(g => !g.archived && g.status !== 'completed' && g.status !== 'abandoned');
			const completedGoals = yearGoals.filter(g => !g.archived && g.status === 'completed');
			const archivedGoals = yearGoals.filter(g => g.archived);

			const currentYear = new Date().getFullYear();
			const yearLabel = year === currentYear ? `${year} (Current Year)` : year.toString();

			md += `## 📅 ${yearLabel}\n\n`;

			// Active goals
			if (activeGoals.length > 0) {
				md += '### 🎯 Active Goals\n\n';
				activeGoals.forEach(goal => {
					const statusEmoji = {
						'not-started': '⚪',
						'in-progress': '🔵',
						'at-risk': '🔴',
						'completed': '✅',
						'abandoned': '⚫'
					}[goal.status];

					md += `#### ${statusEmoji} ${goal.title}\n\n`;
					md += `**${goal.category}** | ${goal.timeframe} | Progress: ${goal.progress}%\n\n`;
					md += `${goal.description}\n\n`;
					md += `📅 **Timeline:** ${goal.startDate} → ${goal.targetDate}\n\n`;

					if (goal.keyResults && goal.keyResults.length > 0) {
						md += `**Key Results:**\n`;
						goal.keyResults.forEach(kr => {
							const checkbox = kr.completed ? '[x]' : '[ ]';
							md += `- ${checkbox} ${kr.description}: ${kr.current} / ${kr.target}\n`;
						});
						md += '\n';
					}

					if (goal.blockers && goal.blockers.length > 0) {
						md += `**🚫 Blockers:**\n`;
						goal.blockers.forEach(b => md += `- ${b}\n`);
						md += '\n';
					}

					md += `---\n\n`;
				});
			}

			// Completed goals
			if (completedGoals.length > 0) {
				md += '### ✅ Completed Goals\n\n';
				completedGoals.forEach(goal => {
					md += `- **${goal.title}** (${goal.targetDate})\n`;
				});
				md += '\n';
			}

			// Archived goals summary
			if (archivedGoals.length > 0) {
				const completedArchived = archivedGoals.filter(g => g.status === 'completed').length;
				md += `### 📦 Archived (${archivedGoals.length} total, ${completedArchived} completed)\n\n`;
				md += `*Goals from ${year} have been archived.*\n\n`;
			}

			if (activeGoals.length === 0 && completedGoals.length === 0 && archivedGoals.length === 0) {
				md += '*No goals for this year.*\n\n';
			}

			md += '---\n\n';
		});

		return md;
	}

	/**
	 * Generate a unique ID for goals, check-ins, etc.
	 */
	generateId(): string {
		return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
	}
}
