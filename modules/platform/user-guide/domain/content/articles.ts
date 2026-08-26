import type { GuideArticle } from '../model/guide'

export const GUIDE_ARTICLES: GuideArticle[] = [
  // ── Getting started ───────────────────────────────────────────────
  {
    id: 'getting-started-what-is-scopery',
    groupId: 'getting-started',
    title: 'What is Scopery?',
    subtitle: 'A single platform that covers the full software delivery lifecycle — from planning to release.',
    keywords: ['what is', 'scopery', 'intro', 'overview', 'platform', 'why', 'purpose'],
    suggestedQuestions: [
      'What is Scopery?',
      'What can I do in Scopery?',
      'Who is Scopery for?',
      'Why use Scopery?',
    ],
    steps: [
      {
        title: 'One platform for the full delivery lifecycle',
        body: 'Most teams juggle multiple disconnected tools — a task tracker for planning, a wiki for requirements, a spreadsheet for test cases, a separate tool for change requests. Scopery brings all of these into one place so your team works from a single source of truth.',
      },
      {
        title: 'Who uses Scopery?',
        body: 'Project Managers plan work and track progress. Business Analysts capture requirements, use cases, and screen specs. QA Engineers write test cases, run test cycles, and log defects. Team Leads manage baselines and change requests. Stakeholders get visibility into status, scope, and quality from one dashboard.',
      },
      {
        title: 'Five areas, one connected flow',
        body: 'Plan → Scope & Requirements → Quality → Commercial → Control. Each area feeds the next. Requirements link to test cases. Test runs gate releases. Change requests update baselines. Nothing is siloed.',
      },
      {
        title: 'AI-assisted throughout',
        body: 'Scopery has a built-in AI Assistant you can ask questions about your project, and AI Agents that can automate repetitive tasks like test case generation and status summarization.',
        uiHints: ['AI Assistant'],
      },
    ],
    relatedIds: ['getting-started-overview', 'getting-started-lifecycle', 'getting-started-end-to-end'],
  },
  {
    id: 'getting-started-overview',
    groupId: 'getting-started',
    title: 'How Scopery is organized',
    subtitle: 'Org → Workspace → Project — understand the hierarchy before you start.',
    diagramType: 'org-hierarchy',
    keywords: ['overview', 'navigation', 'sidebar', 'org', 'workspace', 'project', 'start', 'hierarchy'],
    suggestedQuestions: [
      'How is Scopery organized?',
      'Where do I start?',
      'What is a workspace vs project?',
      'What is an org?',
    ],
    prerequisites: ['You have a login and at least one organization membership.'],
    steps: [
      {
        title: 'Organization — the top level',
        body: 'Your organization is your company or team account. It holds all your workspaces, members, and billing. You can belong to multiple orgs if you work across clients or companies.',
        uiHints: ['Org switcher'],
      },
      {
        title: 'Workspace — a department or team',
        body: 'A workspace groups related projects together. It has its own member list, roles, and settings. Common patterns: one workspace per department (Engineering, QA, Product), or one per client if you are an agency.',
        uiHints: ['Workspace switcher'],
      },
      {
        title: 'Project — a delivery initiative',
        body: 'A project is where the actual work lives. Each project has its own set of workbench tabs: Plan, Scope & Requirements, Quality, Commercial, and Control. Projects belong to exactly one workspace.',
        uiHints: ['Project switcher'],
      },
      {
        title: 'Find your context in the sidebar',
        body: 'The top of the left sidebar always shows which workspace and project you are in. Click the name to switch. Below the divider you see the navigation for your current context — workspace-level links or project workbench tabs.',
        uiHints: ['Workspace / project switcher (top-left)'],
      },
    ],
    relatedIds: ['getting-started-what-is-scopery', 'getting-started-lifecycle', 'workspace-switch', 'project-create'],
  },
  {
    id: 'getting-started-lifecycle',
    groupId: 'getting-started',
    title: 'The five workbench areas',
    subtitle: 'Plan → Scope → Quality → Commercial → Control. What each area does and when to use it.',
    diagramType: 'delivery-lifecycle',
    keywords: ['plan', 'scope', 'quality', 'commercial', 'control', 'lifecycle', 'workbench', 'areas', 'tabs'],
    suggestedQuestions: [
      'What are the five areas?',
      'What is the Plan tab?',
      'What is Scope and Requirements?',
      'Where do I write test cases?',
      'What is Control for?',
    ],
    steps: [
      {
        title: 'Plan — track and schedule work',
        body: 'Create Work Items (tasks, stories, epics), build your plan structure (WBS), schedule on the Timeline, and run capacity planning with Schedule. This is where the team knows what to build and by when.',
        uiHints: ['Work Items', 'Timeline', 'Schedule', 'Plan Structure'],
      },
      {
        title: 'Scope & Requirements — define what to build',
        body: 'Capture Requirements, break them into Functions and Use Cases, write Screen Specs with field-level detail, and use Traceability to confirm every requirement is covered by a test case. This is the contract between stakeholders and the delivery team.',
        uiHints: ['Requirements', 'Functions', 'Use Cases', 'Screen Specs', 'Traceability'],
      },
      {
        title: 'Quality — verify what was built',
        body: 'Write Test Cases, group them into Test Runs, execute and track pass/fail results, log Defects when something breaks, and gate Releases against quality criteria. QA engineers live here.',
        uiHints: ['Test Cases', 'Test Runs', 'Defects', 'Releases'],
      },
      {
        title: 'Commercial — manage cost and contracts',
        body: 'Track budget, contracts, and procurement. Useful for project managers and commercial leads who need cost visibility alongside delivery progress.',
        uiHints: ['Commercial'],
      },
      {
        title: 'Control — manage change and risk',
        body: 'Lock the project plan into a Baseline, manage Change Requests when scope shifts, and track risks, assumptions, issues, and dependencies in RAID. Decisions are recorded here too so nothing gets lost in email threads.',
        uiHints: ['Baselines', 'Change Requests', 'RAID', 'Decisions'],
      },
    ],
    relatedIds: ['getting-started-what-is-scopery', 'getting-started-end-to-end', 'scope-requirements', 'quality-cases'],
  },
  {
    id: 'getting-started-avatar-menu',
    groupId: 'getting-started',
    title: 'Avatar menu: Settings, Guideline, Sign out',
    subtitle: 'Everything under your profile at the bottom of the sidebar.',
    keywords: ['avatar', 'settings', 'help', 'guideline', 'logout', 'sign out', 'admin'],
    suggestedQuestions: ['How do I open settings?', 'Where is Guideline?', 'How do I sign out?'],
    steps: [
      {
        title: 'Open the menu',
        body: 'Click your avatar (and name) at the bottom-left of the sidebar.',
        uiHints: ['Avatar'],
      },
      {
        title: 'Settings',
        body: 'Opens workspace settings (if you can manage the workspace) or your account profile.',
        uiHints: ['Settings'],
      },
      {
        title: 'Guideline',
        body: 'Opens this user guide (left nav + search + step-by-step articles).',
        uiHints: ['Guideline'],
      },
      {
        title: 'Sign out',
        body: 'Ends your session and returns you to login.',
        uiHints: ['Sign out'],
      },
    ],
  },
  {
    id: 'getting-started-end-to-end',
    groupId: 'getting-started',
    title: 'End-to-end delivery workflow',
    subtitle: 'How a project flows from scope definition to release — all in one platform.',
    diagramType: 'workflow-e2e',
    keywords: ['flow', 'process', 'delivery', 'e2e', 'workflow', 'scope', 'plan', 'risk', 'meeting', 'release'],
    suggestedQuestions: [
      'What is the full project workflow?',
      'Where do I start a new project?',
      'How does scope connect to testing?',
      'How do I track risk?',
    ],
    steps: [
      {
        title: 'Define Scope first',
        body: 'Before planning any tasks, capture what you are building. Write Requirements, break them into Functions and Use Cases, then map Screen Specs for any UI. This becomes the reference everything else traces back to.',
        uiHints: ['Requirements', 'Use Cases', 'Screen Specs', 'Traceability'],
      },
      {
        title: 'Plan the work',
        body: 'Turn scope into deliverables. Create Work Items, structure them in Plan Structure, schedule on the Timeline, and run Schedule to check team capacity. Milestones mark key delivery dates.',
        uiHints: ['Work Items', 'Timeline', 'Schedule'],
      },
      {
        title: 'Capture docs and meeting outcomes',
        body: 'Log Meeting Notes and attach Documents directly inside the project so decisions stay in context. Action Items from meetings link back to Work Items so nothing falls through the cracks.',
        uiHints: ['Meeting Notes', 'Documents', 'Decisions'],
      },
      {
        title: 'Track risk and control change',
        body: 'Use the RAID log for risks, assumptions, issues, and dependencies. When scope or plan changes, raise a Change Request — it updates the Baseline and keeps a full audit trail.',
        uiHints: ['RAID', 'Change Requests', 'Baselines'],
      },
      {
        title: 'Verify quality before shipping',
        body: 'Write Test Cases linked to requirements, run them in Test Runs, log Defects, and close the loop. Releases are gated: you can define quality criteria that must pass before a release is approved.',
        uiHints: ['Test Cases', 'Test Runs', 'Defects', 'Releases'],
      },
      {
        title: 'Lock and release',
        body: 'Once the release passes its gate, lock the project state with a Baseline. This freezes the reference for that version — future changes start a new change cycle.',
        uiHints: ['Releases', 'Baselines'],
      },
    ],
    relatedIds: ['getting-started-what-is-scopery', 'getting-started-lifecycle', 'scope-requirements', 'quality-cases'],
  },

  // ── Workspace ─────────────────────────────────────────────────────
  {
    id: 'workspace-switch',
    groupId: 'workspace',
    title: 'Switch workspace or project',
    subtitle: 'Jump between workspaces and projects without leaving the shell.',
    keywords: ['switch', 'workspace', 'project', 'switcher'],
    suggestedQuestions: ['How do I switch workspace?', 'How do I open another project?'],
    steps: [
      {
        title: 'Open the switcher',
        body: 'Click the workspace/project label in the top-left of the sidebar.',
        uiHints: ['Workspace / project switcher'],
      },
      {
        title: 'Pick a workspace',
        body: 'Select another workspace from the list. Navigation reloads for that workspace.',
      },
      {
        title: 'Pick a project',
        body: 'Choose a project to enter the project workbench (Plan, Scope, Quality…).',
      },
    ],
    relatedIds: ['project-create', 'getting-started-overview'],
  },
  {
    id: 'workspace-projects-list',
    groupId: 'workspace',
    title: 'Browse projects in a workspace',
    subtitle: 'Find and open projects from the workspace Projects area.',
    keywords: ['projects', 'list', 'open project'],
    suggestedQuestions: ['Where is the projects list?', 'How do I open a project?'],
    steps: [
      {
        title: 'Go to Projects',
        body: 'From workspace navigation, open Projects.',
        uiHints: ['Projects'],
      },
      {
        title: 'Open a project',
        body: 'Click a project. You land in the project workbench (usually Overview).',
      },
    ],
    relatedIds: ['project-create', 'project-overview'],
  },

  // ── Project ───────────────────────────────────────────────────────
  {
    id: 'project-create',
    groupId: 'project',
    title: 'Create a project',
    subtitle: 'Spin up a project so Plan / Scope / Quality tabs become available.',
    keywords: ['create project', 'new project', 'setup'],
    suggestedQuestions: ['How do I create a project?', 'What do I need before creating a project?'],
    prerequisites: [
      'You are inside a workspace.',
      'You have permission to create projects.',
    ],
    steps: [
      {
        title: 'Start create',
        body: 'From Projects, use the create action.',
        uiHints: ['Create project', 'New project'],
      },
      {
        title: 'Fill required fields',
        body: 'Enter at least a name (and code if required). Optional: dates, template, description.',
      },
      {
        title: 'Confirm',
        body: 'Submit the form to enter the new project workbench.',
        uiHints: ['Create', 'Save'],
      },
      {
        title: 'Invite people',
        body: 'Open Directory to add teammates before planning.',
        uiHints: ['Directory'],
      },
    ],
    relatedIds: ['project-overview', 'project-directory', 'plan-work-items'],
  },
  {
    id: 'project-overview',
    groupId: 'project',
    title: 'Project Overview',
    subtitle: 'Landing page for status and orientation inside a project.',
    keywords: ['overview', 'dashboard', 'project home'],
    suggestedQuestions: ['What is Overview?', 'Where is the project home?'],
    steps: [
      {
        title: 'Open Overview',
        body: 'Project sidebar → Project → Overview.',
        uiHints: ['Overview'],
      },
      {
        title: 'Use it as a hub',
        body: 'Scan summary information and jump into Plan, Scope, or Quality from here when links are shown.',
      },
    ],
    relatedIds: ['plan-work-items', 'plan-timeline'],
  },
  {
    id: 'project-directory',
    groupId: 'project',
    title: 'Directory (project members)',
    subtitle: 'Who can see and edit this project.',
    keywords: ['members', 'directory', 'invite', 'permissions'],
    suggestedQuestions: ['How do I add members?', 'Where is project Directory?'],
    prerequisites: ['You can manage project membership.'],
    steps: [
      {
        title: 'Open Directory',
        body: 'Project sidebar → Project → Directory.',
        uiHints: ['Directory'],
      },
      {
        title: 'Add or adjust members',
        body: 'Invite users or change roles according to your org IAM setup.',
      },
    ],
  },

  // ── Plan ──────────────────────────────────────────────────────────
  {
    id: 'plan-work-items',
    groupId: 'plan',
    title: 'Work Items',
    subtitle: 'Create and manage tasks that feed Plan Structure, Timeline, and Schedule.',
    keywords: ['work items', 'tasks', 'todo', 'create task', 'board', 'list'],
    suggestedQuestions: ['How do I create a task?', 'What are Work Items?'],
    prerequisites: ['You are inside a project.', 'You can create/update tasks.'],
    diagramType: 'plan-overview',
    steps: [
      {
        title: 'Open Work Items',
        body: 'Project sidebar → Plan → Work Items.',
        uiHints: ['Work Items'],
      },
      {
        title: 'Pick a view',
        body: 'Switch between List and Board as needed.',
        uiHints: ['List', 'Board'],
      },
      {
        title: 'Create a task',
        body: 'Click New task. Fill title, estimate hours, dates, assignee, and planning element/phase when available. Confirm with Create.',
        uiHints: ['New task', 'Create', 'Cancel'],
      },
      {
        title: 'Keep estimates accurate',
        body: 'Estimate hours drive Timeline Planned %, Effort, and Occupancy. Update the task when scope changes.',
      },
    ],
    relatedIds: ['plan-wbs', 'plan-timeline', 'plan-schedule'],
  },
  {
    id: 'plan-wbs',
    groupId: 'plan',
    title: 'Plan Structure',
    subtitle: 'Organize work into planning elements before detailed scheduling.',
    keywords: [
      'wbs',
      'plan structure',
      'planning element',
      'breakdown',
      'structure',
      'phase',
      'node',
    ],
    suggestedQuestions: [
      'How do I use Plan Structure?',
      'How do I add a planning element?',
    ],
    steps: [
      {
        title: 'Open Plan Structure',
        body: 'Project sidebar → Plan → Plan Structure.',
        uiHints: ['Plan Structure'],
      },
      {
        title: 'Add a planning element',
        body: 'Click Add element (or Add child on a row). Confirm with Add.',
        uiHints: ['Add element', 'Add child', 'Add', 'Cancel'],
      },
      {
        title: 'Archive when obsolete',
        body: 'Use Archive on a row to retire an element without deleting history where supported.',
        uiHints: ['Archive'],
      },
      {
        title: 'Link tasks',
        body: 'When creating tasks in Work Items, assign a planning element so Timeline stays organized.',
      },
    ],
    relatedIds: ['plan-work-items', 'plan-timeline'],
  },
  {
    id: 'plan-timeline',
    groupId: 'plan',
    title: 'Timeline (Cell Timeline)',
    subtitle: 'Excel-like schedule grid: Day/Week/Month, draft edits, progress, allocation.',
    keywords: [
      'timeline',
      'gantt',
      'cell',
      'apply changes',
      'planned %',
      'actual %',
      'variance',
      'occupancy',
      'drag',
      'fill handle',
    ],
    suggestedQuestions: [
      'How do I use Timeline?',
      'What does Apply Changes do?',
      'How do I record Actual %?',
      'How do I edit allocation?',
    ],
    prerequisites: [
      'Project has tasks (Work Items).',
      'Tasks ideally have estimate hours and dates (or schedule them here).',
    ],
    steps: [
      {
        title: 'Open Timeline',
        body: 'Project sidebar → Plan → Timeline.',
        uiHints: ['Timeline'],
      },
      {
        title: 'Choose mode & metric',
        body: 'Mode: Timeline or Planning. Metric: Schedule, Effort, Planned %, Actual %, Variance, Occupancy.',
        uiHints: [
          'Timeline',
          'Planning',
          'Schedule',
          'Effort',
          'Planned %',
          'Actual %',
          'Variance',
          'Occupancy',
        ],
      },
      {
        title: 'Zoom the calendar',
        body: 'Switch Day / Week / Month. Today jumps to today; Fit fits the visible schedule range.',
        uiHints: ['Day', 'Week', 'Month', 'Today', 'Fit'],
      },
      {
        title: 'Schedule a task',
        body: 'On an unscheduled row use Schedule or + Add task. Drag to move; resize edges to change duration. Use the fill handle for bulk date fills where shown.',
        uiHints: ['+ Add task', 'Schedule', 'Fill handle'],
      },
      {
        title: 'Draft vs Apply Changes',
        body: 'Edits stay in a local draft. Review the draft bar, then Apply Changes to persist. Undo reverts draft steps.',
        uiHints: ['Apply Changes', 'Undo'],
      },
      {
        title: 'Record progress (Actual %)',
        body: 'Press P or use Update progress on a task row. Enter % complete. Actual is never invented from Start–End alone.',
        uiHints: ['Update progress (P)', 'P'],
      },
      {
        title: 'Read Variance & at-risk',
        body: 'Variance = Actual − Cumulative Planned. Far-behind tasks may appear at-risk in the health bar.',
      },
      {
        title: 'Edit Allocation & Occupancy',
        body: 'Edit Allocation sets manual minutes per day (overrides Mon–Fri auto split). Occupancy compares planned minutes to an 8h day.',
        uiHints: ['Edit Allocation', 'Occupancy'],
      },
      {
        title: 'Dependencies & critical path',
        body: 'Link Finish-to-Start in the dependencies panel. Toggle Critical path to highlight the chain. Auto Schedule recalculates via the scheduler.',
        uiHints: ['Auto Schedule', 'Critical path'],
      },
      {
        title: 'Hide unscheduled / review issues',
        body: 'Toggle hide unscheduled to focus the grid. Open Schedule issues when capacity/dependency problems appear.',
        uiHints: ['Hide unscheduled', 'Show unscheduled', 'Schedule issues'],
      },
    ],
    relatedIds: ['plan-work-items', 'plan-schedule', 'plan-resources'],
  },
  {
    id: 'plan-schedule',
    groupId: 'plan',
    title: 'Schedule',
    subtitle: 'Capacity-aware scheduling and schedule runs / issues.',
    keywords: ['schedule', 'recalculate', 'capacity', 'schedule run'],
    suggestedQuestions: ['How do I run Schedule?', 'What is a schedule run?'],
    prerequisites: ['Tasks exist with estimates and assignees where the scheduler requires them.'],
    steps: [
      {
        title: 'Open Schedule',
        body: 'Project sidebar → Plan → Schedule.',
        uiHints: ['Schedule'],
      },
      {
        title: 'Run or refresh',
        body: 'Trigger Recalculate / Run schedule when available. Review issues if capacity or dependencies block work.',
        uiHints: ['Recalculate', 'Run schedule'],
      },
      {
        title: 'Reflect on Timeline',
        body: 'After a successful run, open Timeline to see updated bars. Manual Timeline overrides may still apply on top.',
      },
    ],
    relatedIds: ['plan-timeline', 'plan-resources'],
  },
  {
    id: 'plan-resources',
    groupId: 'plan',
    title: 'Resources',
    subtitle: 'People, capacity, and how effort is allocated.',
    keywords: ['resources', 'capacity', 'allocation', 'assignee'],
    suggestedQuestions: ['Where do I manage resources?', 'How is capacity used?'],
    steps: [
      {
        title: 'Open Resources',
        body: 'Project sidebar → Plan → Resources.',
        uiHints: ['Resources'],
      },
      {
        title: 'Align people with tasks',
        body: 'Ensure assignees match capacity profiles so Schedule and Occupancy stay meaningful.',
      },
    ],
    relatedIds: ['plan-schedule', 'plan-timeline', 'project-directory'],
  },

  // ── Scope & Requirements ──────────────────────────────────────────
  {
    id: 'scope-basics',
    groupId: 'scope',
    title: 'Scope',
    subtitle: 'Decide what is in / out of scope for this project.',
    keywords: ['scope', 'in scope', 'out of scope'],
    suggestedQuestions: ['How do I set project scope?'],
    diagramType: 'scope-overview',
    steps: [
      {
        title: 'Open Scope',
        body: 'Project sidebar → Scope & Requirements → Scope.',
        uiHints: ['Scope'],
      },
      {
        title: 'Classify items',
        body: 'Mark modules/items as primary, impacted, or out of scope, then save.',
        uiHints: ['Save'],
      },
    ],
    relatedIds: ['scope-deliverables', 'scope-requirements', 'scope-traceability'],
  },
  {
    id: 'scope-deliverables',
    groupId: 'scope',
    title: 'Deliverables',
    subtitle: 'Track what the project must produce and hand over.',
    keywords: ['deliverables', 'delivery', 'handover'],
    suggestedQuestions: ['How do I add a deliverable?'],
    steps: [
      {
        title: 'Open Deliverables',
        body: 'Project sidebar → Scope & Requirements → Deliverables.',
        uiHints: ['Deliverables'],
      },
      {
        title: 'Create one',
        body: 'Click New deliverable. In Add deliverable, fill fields and confirm with Add.',
        uiHints: ['New deliverable', 'Add deliverable', 'Add', 'Cancel'],
      },
      {
        title: 'Manage from the drawer',
        body: 'Open a deliverable to review Comments, Archive, or Close.',
        uiHints: ['Comments', 'Archive', 'Close'],
      },
    ],
    relatedIds: ['scope-basics', 'control-baselines'],
  },
  {
    id: 'scope-requirements',
    groupId: 'scope',
    title: 'Requirements',
    subtitle: 'Capture structured requirements and Specification Packages.',
    keywords: [
      'requirements',
      'BO',
      'BR',
      'FR',
      'NFR',
      'specification packages',
      'spec packs',
      'bulk',
      'json import',
    ],
    suggestedQuestions: [
      'How do I add a requirement?',
      'How do I bulk import requirements?',
      'What are Specification Packages?',
    ],
    steps: [
      {
        title: 'Open Requirements',
        body: 'Project sidebar → Scope & Requirements → Requirements.',
        uiHints: ['Requirements'],
      },
      {
        title: 'Use Catalog vs Specification Packages',
        body: 'Catalog lists requirements. Specification Packages groups them for export/review.',
        uiHints: ['Catalog', 'Specification Packages'],
      },
      {
        title: 'Add one or many',
        body: 'Click Add requirement → Single add, Bulk add, or JSON import.',
        uiHints: ['Add requirement', 'Single add', 'Bulk add', 'JSON import', 'Create', 'Create N'],
      },
      {
        title: 'Filter evidence gaps',
        body: 'Use All / With evidence / Missing to find incomplete items.',
        uiHints: ['All', 'With evidence', 'Missing'],
      },
      {
        title: 'Create a Specification Package',
        body: 'On Specification Packages: New → Create Specification Package / Create package (N). Export with Export DOCX when ready.',
        uiHints: [
          'New',
          'Create Specification Package',
          'Create package (N)',
          'Export DOCX',
          'Refresh',
          'Delete',
        ],
      },
    ],
    relatedIds: ['scope-functions', 'scope-use-cases', 'scope-traceability'],
  },
  {
    id: 'scope-functions',
    groupId: 'scope',
    title: 'Functions (Functional Catalog)',
    subtitle: 'Functional items and NFRs between requirements and delivery.',
    keywords: ['functions', 'functional catalog', 'FR', 'NFR', 'acceptance'],
    suggestedQuestions: ['What is Functions?', 'How do I add an FR?', 'How do I import functional items?'],
    steps: [
      {
        title: 'Open Functions',
        body: 'Project sidebar → Scope & Requirements → Functions (Functional Catalog).',
        uiHints: ['Functions', 'Functional Catalog'],
      },
      {
        title: 'Switch tabs',
        body: 'Work in Functional, NFR, or Import.',
        uiHints: ['Functional', 'NFR', 'Import'],
      },
      {
        title: 'Add FR or NFR',
        body: 'Use Add FR / Add NFR → Single add, Bulk add, or JSON import.',
        uiHints: ['Add FR', 'Add NFR', 'Single add', 'Bulk add', 'JSON import'],
      },
      {
        title: 'Acceptance & use cases',
        body: 'Edit an item, Save acceptance when ready, and Add Use Cases to extend coverage.',
        uiHints: ['Edit', 'Done', 'Save acceptance', 'Add Use Cases'],
      },
    ],
    relatedIds: ['scope-requirements', 'scope-use-cases', 'scope-traceability'],
  },
  {
    id: 'scope-use-cases',
    groupId: 'scope',
    title: 'Use Cases',
    subtitle: 'Actor–system interactions that validate scope.',
    keywords: ['use cases', 'actors', 'flows', 'bulk link'],
    suggestedQuestions: ['How do I add a use case?', 'How do I link functions to use cases?'],
    steps: [
      {
        title: 'Open Use Cases',
        body: 'Project sidebar → Scope & Requirements → Use Cases.',
        uiHints: ['Use Cases'],
      },
      {
        title: 'Add use cases',
        body: 'Click Add Use Case → Single add, Bulk add, or JSON import. Confirm with Create N when bulk.',
        uiHints: ['Add Use Case', 'Single add', 'Bulk add', 'JSON import', 'Create N', 'Cancel'],
      },
      {
        title: 'Bulk link to functions',
        body: 'Use Bulk link / Function → Use Case Links to connect catalog items.',
        uiHints: ['Bulk link', 'Function → Use Case Links', 'Back to catalog'],
      },
    ],
    relatedIds: ['scope-functions', 'scope-traceability', 'quality-cases'],
  },
  {
    id: 'scope-application-structure',
    groupId: 'scope',
    title: 'Application Structure',
    subtitle: 'Map applications / modules that implement the solution.',
    keywords: ['application structure', 'apps', 'modules', 'architecture'],
    suggestedQuestions: ['What is Application Structure?'],
    steps: [
      {
        title: 'Open Application Structure',
        body: 'Project sidebar → Scope & Requirements → Application Structure.',
        uiHints: ['Application Structure'],
      },
      {
        title: 'Maintain the structure',
        body: 'Add or edit application/module nodes so Requirements and Traceability can reference them.',
      },
    ],
    relatedIds: ['scope-basics', 'scope-traceability'],
  },
  {
    id: 'scope-traceability',
    groupId: 'scope',
    title: 'Traceability',
    subtitle: 'Links and coverage across requirements, functions, use cases, and tests.',
    keywords: ['traceability', 'trace', 'coverage', 'explorer', 'matrix', 'missing tests'],
    suggestedQuestions: [
      'How do I view traceability?',
      'How do I find missing test coverage?',
      'How do I link a function?',
    ],
    steps: [
      {
        title: 'Open Traceability',
        body: 'Project sidebar → Scope & Requirements → Traceability.',
        uiHints: ['Traceability'],
      },
      {
        title: 'Use the tabs',
        body: 'Overview, Functional, Implementation, NFR, Explorer.',
        uiHints: ['Overview', 'Functional', 'Implementation', 'NFR', 'Explorer'],
      },
      {
        title: 'Close gaps from Overview',
        body: 'Follow next actions such as Link Requirements, Add Use Cases, Add Test Coverage, Add NFR Verification.',
        uiHints: [
          'Link Requirements',
          'Add Use Cases',
          'Add Test Coverage',
          'Add NFR Verification',
        ],
      },
      {
        title: 'Explore a root item',
        body: 'In Explorer, pick Requirement / Function / Use Case / Test Case and Explore. Retry if load fails.',
        uiHints: ['Explore', 'Retry', 'Requirement', 'Function', 'Use Case', 'Test Case'],
      },
      {
        title: 'Filter the matrix',
        body: 'Use All, Missing Tests, Failed, Blocked, Not Run, Open Defects.',
        uiHints: ['All', 'Missing Tests', 'Failed', 'Blocked', 'Not Run', 'Open Defects'],
      },
      {
        title: 'Act from a drawer',
        body: 'Link Function, Create Test Case from Use Case, Open Verification Runs, or Open detail.',
        uiHints: [
          'Link Function',
          'Create Test Case from Use Case',
          'Open Verification Runs',
          'Open detail',
        ],
      },
    ],
    relatedIds: ['scope-requirements', 'scope-functions', 'quality-cases', 'quality-runs'],
  },

  // ── Quality ───────────────────────────────────────────────────────
  {
    id: 'quality-overview',
    groupId: 'quality',
    title: 'Quality Overview',
    subtitle: 'Hub for Cases → Runs → Defects → Releases.',
    keywords: ['quality', 'qa', 'testing', 'overview'],
    suggestedQuestions: ['Where is Quality?', 'How does the quality workflow work?'],
    diagramType: 'quality-overview',
    steps: [
      {
        title: 'Open Quality Overview',
        body: 'Project sidebar → Quality → Overview.',
        uiHints: ['Overview', 'Quality'],
      },
      {
        title: 'Navigate or add',
        body: 'Use Open to jump into an area, Settings for config, Add for quick create shortcuts.',
        uiHints: ['Open', 'Settings', 'Add'],
      },
      {
        title: 'Typical flow',
        body: 'Write Cases → execute in Runs → log Defects → gate Releases.',
      },
    ],
    relatedIds: ['quality-cases', 'quality-runs', 'quality-defects', 'quality-releases'],
  },
  {
    id: 'quality-cases',
    groupId: 'quality',
    title: 'Quality Cases',
    subtitle: 'Functional tests and NFR verifications.',
    keywords: ['test cases', 'cases', 'verification', 'mark ready', 'json import'],
    suggestedQuestions: ['How do I create a test case?', 'How do I import cases?'],
    steps: [
      {
        title: 'Open Cases',
        body: 'Quality → Cases.',
        uiHints: ['Cases'],
      },
      {
        title: 'Pick a tab',
        body: 'Functional Tests or NFR Verifications.',
        uiHints: ['Functional Tests', 'NFR Verifications'],
      },
      {
        title: 'Add cases',
        body: 'Add case / Add Test case → Single add, Bulk add (Excel), JSON import, or Use Case → Test Case.',
        uiHints: [
          'Add case',
          'Add Test case',
          'Single add',
          'Bulk add (Excel)',
          'JSON import',
          'Use Case → Test Case',
        ],
      },
      {
        title: 'Bulk status',
        body: 'Select rows then Mark Ready, Archive, or Clear.',
        uiHints: ['Mark Ready', 'Archive', 'Clear'],
      },
    ],
    relatedIds: ['quality-runs', 'scope-use-cases', 'scope-traceability'],
  },
  {
    id: 'quality-runs',
    groupId: 'quality',
    title: 'Quality Runs',
    subtitle: 'Execute cases and record Pass / Skip results.',
    keywords: ['test runs', 'runs', 'execute', 'pass', 'skip'],
    suggestedQuestions: ['How do I run tests?', 'How do I save a test result?'],
    steps: [
      {
        title: 'Open Runs',
        body: 'Quality → Runs.',
        uiHints: ['Runs'],
      },
      {
        title: 'Create / add a run',
        body: 'Use Add / Add Test run → Single add, Bulk add, or JSON import when available.',
        uiHints: ['Add', 'Add Test run', 'Single add', 'Bulk add', 'JSON import'],
      },
      {
        title: 'Execute',
        body: 'Start the run, Add cases if needed, then mark Pass / Skip / Clear and Save result. Complete or Cancel when finished.',
        uiHints: ['Start', 'Add cases', 'Pass', 'Skip', 'Clear', 'Save result', 'Complete', 'Cancel'],
      },
    ],
    relatedIds: ['quality-cases', 'quality-defects'],
  },
  {
    id: 'quality-defects',
    groupId: 'quality',
    title: 'Defects',
    subtitle: 'Log and drive bugs found in runs or elsewhere.',
    keywords: ['defects', 'bugs', 'issues', 'create defect'],
    suggestedQuestions: ['How do I log a defect?'],
    steps: [
      {
        title: 'Open Defects',
        body: 'Quality → Defects.',
        uiHints: ['Defects'],
      },
      {
        title: 'Create a defect',
        body: 'Click Create defect (or Add Defect). Set severity/priority and link to case/run when possible.',
        uiHints: ['Create defect', 'Add Defect'],
      },
    ],
    relatedIds: ['quality-runs', 'quality-releases'],
  },
  {
    id: 'quality-releases',
    groupId: 'quality',
    title: 'Releases',
    subtitle: 'Gate readiness and mark software as released.',
    keywords: ['releases', 'readiness', 'mark released', 'override'],
    suggestedQuestions: ['How do I check release readiness?', 'How do I mark released?'],
    steps: [
      {
        title: 'Open Releases',
        body: 'Quality → Releases.',
        uiHints: ['Releases'],
      },
      {
        title: 'Add a release',
        body: 'Use Add / Add Release when creating a new release record.',
        uiHints: ['Add', 'Add Release'],
      },
      {
        title: 'Gate and ship',
        body: 'Check readiness → Mark ready → Mark released. Use Override only when process allows.',
        uiHints: ['Check readiness', 'Mark ready', 'Mark released', 'Override'],
      },
    ],
    relatedIds: ['quality-defects', 'quality-runs', 'control-baselines'],
  },

  // ── Commercial ────────────────────────────────────────────────────
  {
    id: 'commercial-estimation',
    groupId: 'commercial',
    title: 'Estimation',
    subtitle: 'Run estimation scenarios and mark the current one.',
    keywords: ['estimation', 'estimate', 'commercial', 'run'],
    suggestedQuestions: ['How do I run estimation?', 'How do I mark current estimation?'],
    steps: [
      {
        title: 'Open Estimation',
        body: 'Project sidebar → Commercial → Estimation.',
        uiHints: ['Estimation'],
      },
      {
        title: 'New run',
        body: 'Click New estimation run → Run estimation.',
        uiHints: ['New estimation run', 'Run estimation', 'Cancel'],
      },
      {
        title: 'Mark current',
        body: 'When a run is the reference, use Mark current.',
        uiHints: ['Mark current'],
      },
    ],
    relatedIds: ['commercial-quotes', 'commercial-financials'],
  },
  {
    id: 'commercial-financials',
    groupId: 'commercial',
    title: 'Financials',
    subtitle: 'Project financial picture (cost / revenue views).',
    keywords: ['financials', 'cost', 'budget', 'money'],
    suggestedQuestions: ['Where are project Financials?'],
    steps: [
      {
        title: 'Open Financials',
        body: 'Project sidebar → Commercial → Financials.',
        uiHints: ['Financials'],
      },
      {
        title: 'Review figures',
        body: 'Use the page’s filters and sections to inspect cost/revenue. Edit only where your role allows.',
      },
    ],
    relatedIds: ['commercial-profitability', 'commercial-estimation'],
  },
  {
    id: 'commercial-profitability',
    groupId: 'commercial',
    title: 'Profitability',
    subtitle: 'Margin and profitability indicators for the project.',
    keywords: ['profitability', 'margin', 'roi'],
    suggestedQuestions: ['Where is Profitability?'],
    steps: [
      {
        title: 'Open Profitability',
        body: 'Project sidebar → Commercial → Profitability.',
        uiHints: ['Profitability'],
      },
      {
        title: 'Interpret results',
        body: 'Compare against Estimation and Quotes that are marked current.',
      },
    ],
    relatedIds: ['commercial-financials', 'commercial-quotes'],
  },
  {
    id: 'commercial-quotes',
    groupId: 'commercial',
    title: 'Quotes',
    subtitle: 'Build, submit, and accept commercial quotes.',
    keywords: ['quotes', 'proposal', 'submit', 'approve', 'send'],
    suggestedQuestions: ['How do I create a quote?', 'How do I approve a quote?'],
    steps: [
      {
        title: 'Open Quotes',
        body: 'Project sidebar → Commercial → Quotes.',
        uiHints: ['Quotes'],
      },
      {
        title: 'Create a quote',
        body: 'Create quote → Create. Add lines and terms in the builder.',
        uiHints: ['Create quote', 'Create', 'Cancel', 'Add line', 'Add term', 'New version'],
      },
      {
        title: 'Advance status',
        body: 'Submit → Approve / Reject → Send → Mark accepted. Mark current when it is the live quote.',
        uiHints: ['Submit', 'Approve', 'Reject', 'Send', 'Mark accepted', 'Mark current'],
      },
    ],
    relatedIds: ['commercial-estimation', 'commercial-financials'],
  },

  // ── Control ───────────────────────────────────────────────────────
  {
    id: 'control-raid',
    groupId: 'control',
    title: 'RAID',
    subtitle: 'Risks, Assumptions, Issues, Dependencies — register and matrix.',
    keywords: ['raid', 'risk', 'issue', 'assumption', 'dependency', 'risk matrix'],
    suggestedQuestions: ['How do I add a RAID item?', 'Where is the risk matrix?'],
    diagramType: 'control-overview',
    steps: [
      {
        title: 'Open RAID',
        body: 'Project sidebar → Control → RAID.',
        uiHints: ['RAID'],
      },
      {
        title: 'Register vs matrix',
        body: 'Use Register for the list; Risk Matrix for visual risk placement.',
        uiHints: ['Register', 'Risk Matrix'],
      },
      {
        title: 'Create an item',
        body: 'New item opens Create RAID item. Add action, Complete, Create task, or Add link as needed.',
        uiHints: ['New item', 'Create RAID item', 'Add action', 'Complete', 'Create task', 'Add link'],
      },
    ],
    relatedIds: ['control-decisions', 'plan-work-items'],
  },
  {
    id: 'control-decisions',
    groupId: 'control',
    title: 'Decisions',
    subtitle: 'Capture options, decide, and keep an audit trail.',
    keywords: ['decisions', 'decide', 'reject', 'options', 'impact'],
    suggestedQuestions: ['How do I log a decision?'],
    steps: [
      {
        title: 'Open Decisions',
        body: 'Project sidebar → Control → Decisions.',
        uiHints: ['Decisions'],
      },
      {
        title: 'Create',
        body: 'New decision → Add.',
        uiHints: ['New decision', 'Add', 'Cancel'],
      },
      {
        title: 'Work the drawer',
        body: 'Tabs: Options, Impact, Links, Comments. Decide, Reject, Archive, or Save impact.',
        uiHints: ['Options', 'Impact', 'Links', 'Comments', 'Decide', 'Reject', 'Archive', 'Save impact'],
      },
    ],
    relatedIds: ['control-raid', 'control-change-requests'],
  },
  {
    id: 'control-baselines',
    groupId: 'control',
    title: 'Baselines',
    subtitle: 'Freeze a reference plan and compare to current.',
    keywords: ['baselines', 'capture', 'approve', 'difference', 'active baseline'],
    suggestedQuestions: ['How do I create a baseline?', 'How do I compare baseline vs current?'],
    steps: [
      {
        title: 'Open Baselines',
        body: 'Project sidebar → Control → Baselines.',
        uiHints: ['Baselines'],
      },
      {
        title: 'Create & capture',
        body: 'Create baseline, then Capture / Capture latest project state.',
        uiHints: ['Create baseline', 'Capture', 'Capture latest project state'],
      },
      {
        title: 'Approve and activate',
        body: 'Check → Approve / Approve as reference plan → Use as active / Use as active baseline.',
        uiHints: [
          'Check',
          'Check baseline',
          'Approve',
          'Approve as reference plan',
          'Use as active',
          'Use as active baseline',
        ],
      },
      {
        title: 'Compare modes',
        body: 'Switch Baseline / Current / Difference views. Archive or Create updated baseline when needed.',
        uiHints: ['Baseline', 'Current', 'Difference', 'Archive', 'Create updated baseline'],
      },
    ],
    relatedIds: ['control-change-requests', 'plan-timeline'],
  },
  {
    id: 'control-change-requests',
    groupId: 'control',
    title: 'Change Requests',
    subtitle: 'Propose, review, and apply changes after a baseline exists.',
    keywords: ['change requests', 'CR', 'submit', 'approve', 'apply'],
    suggestedQuestions: ['How do I create a change request?', 'How do I apply a CR?'],
    prerequisites: ['Often used after an active baseline is in place.'],
    steps: [
      {
        title: 'Open Change Requests',
        body: 'Project sidebar → Control → Change Requests.',
        uiHints: ['Change Requests'],
      },
      {
        title: 'Create a CR',
        body: 'Create CR. Use Register or Board views.',
        uiHints: ['Create CR', 'Register', 'Board'],
      },
      {
        title: 'Author changes',
        body: 'Add change / Add first change, Save draft, then Submit for review.',
        uiHints: ['Add change', 'Add first change', 'Save draft', 'Submit for review'],
      },
      {
        title: 'Review & apply',
        body: 'Approve or Reject. When approved, Apply. Cancel change request if abandoning.',
        uiHints: ['Approve', 'Reject', 'Apply', 'Cancel change request'],
      },
    ],
    relatedIds: ['control-baselines', 'control-decisions'],
  },
  {
    id: 'control-governance',
    groupId: 'control',
    title: 'Governance',
    subtitle: 'Project governance checks and policies (when enabled).',
    keywords: ['governance', 'policy', 'compliance'],
    suggestedQuestions: ['Where is Governance?'],
    steps: [
      {
        title: 'Open Governance',
        body: 'Project sidebar → Control → Governance (feature-flagged).',
        uiHints: ['Governance'],
      },
      {
        title: 'Follow required checks',
        body: 'Complete any listed gates before advancing baselines or releases.',
      },
    ],
    relatedIds: ['control-baselines', 'quality-releases'],
  },

  // ── Collaboration ─────────────────────────────────────────────────
  {
    id: 'collaboration-meetings',
    groupId: 'collaboration',
    title: 'Meetings',
    subtitle: 'Schedule meetings, run agenda/actions, publish notes.',
    keywords: ['meetings', 'agenda', 'recap', 'publish', 'participants'],
    suggestedQuestions: ['How do I schedule a meeting?', 'How do I publish a meeting note?'],
    diagramType: 'collab-overview',
    steps: [
      {
        title: 'Open Meetings',
        body: 'Project sidebar → Collaboration → Meetings.',
        uiHints: ['Meetings'],
      },
      {
        title: 'Schedule',
        body: 'Schedule meeting → Schedule. Browse Upcoming / Past / Series tabs.',
        uiHints: ['Schedule meeting', 'Schedule', 'Cancel', 'Upcoming', 'Past', 'Series'],
      },
      {
        title: 'During the meeting',
        body: 'Add agenda item, Add participants, Add action item → Create. Link existing item or Create task.',
        uiHints: [
          'Add agenda item',
          'Add participants',
          'Add action item',
          'Create',
          'Create task',
          'Link existing item',
        ],
      },
      {
        title: 'Recap & publish',
        body: 'Submit for review → Request changes / Approve → Publish meeting note. Cancel or Archive meeting from the header when needed.',
        uiHints: [
          'Submit for review',
          'Request changes',
          'Approve',
          'Publish meeting note',
          'Cancel meeting',
          'Archive meeting',
        ],
      },
    ],
    relatedIds: ['plan-work-items', 'control-decisions'],
  },
  {
    id: 'collaboration-client',
    groupId: 'collaboration',
    title: 'Client Collaboration',
    subtitle: 'Shared space for client-facing collaboration (when enabled).',
    keywords: ['client', 'collaboration', 'stakeholder'],
    suggestedQuestions: ['Where is Client Collaboration?'],
    steps: [
      {
        title: 'Open Client Collaboration',
        body: 'Project sidebar → Collaboration → Client Collaboration.',
        uiHints: ['Client Collaboration'],
      },
      {
        title: 'Share carefully',
        body: 'Only expose items meant for clients. Prefer published meeting notes and approved quotes.',
      },
    ],
    relatedIds: ['collaboration-meetings', 'commercial-quotes'],
  },

  // ── Intelligence ──────────────────────────────────────────────────
  {
    id: 'intelligence-ai-planning',
    groupId: 'intelligence',
    title: 'AI Planning',
    subtitle: 'Review AI planning suggestions before applying them.',
    keywords: ['ai planning', 'suggestions', 'review'],
    suggestedQuestions: ['How do I use AI Planning?'],
    diagramType: 'ai-overview',
    steps: [
      {
        title: 'Open AI Planning',
        body: 'Project sidebar → Intelligence → AI Planning (feature-flagged).',
        uiHints: ['AI Planning'],
      },
      {
        title: 'Review before apply',
        body: 'Treat suggestions as drafts. Accept only what matches your Plan Structure / Timeline plan.',
      },
      {
        title: 'Also use the shell assistant',
        body: 'The sidebar AI Assistant can help with questions without leaving the page.',
        uiHints: ['AI Assistant'],
      },
    ],
    relatedIds: ['plan-timeline', 'plan-work-items'],
  },
  {
    id: 'intelligence-reports',
    groupId: 'intelligence',
    title: 'Reports',
    subtitle: 'Project reports and exported views.',
    keywords: ['reports', 'export', 'charts'],
    suggestedQuestions: ['Where are project Reports?'],
    steps: [
      {
        title: 'Open Reports',
        body: 'Project sidebar → Intelligence → Reports.',
        uiHints: ['Reports'],
      },
      {
        title: 'Generate / open a report',
        body: 'Pick a report type and date range if prompted, then review or export.',
      },
    ],
    relatedIds: ['intelligence-dashboard', 'plan-timeline'],
  },
  {
    id: 'intelligence-dashboard',
    groupId: 'intelligence',
    title: 'Dashboard',
    subtitle: 'Executive dashboard for the project (when reporting is enabled).',
    keywords: ['dashboard', 'kpi', 'reporting'],
    suggestedQuestions: ['Where is the project Dashboard?'],
    steps: [
      {
        title: 'Open Dashboard',
        body: 'Project sidebar → Intelligence → Dashboard.',
        uiHints: ['Dashboard'],
      },
      {
        title: 'Read the KPIs',
        body: 'Use widgets as a summary; drill into Timeline, Quality, or Financials for detail.',
      },
    ],
    relatedIds: ['intelligence-reports', 'quality-overview', 'commercial-financials'],
  },
]

export const DEFAULT_GUIDE_ID = 'getting-started-overview'
