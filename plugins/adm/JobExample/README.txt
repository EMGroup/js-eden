- turn on the ADM plugin via the menu
- open an ADM Advanced Input view and enter in job-eden code
- open up ADM Human Perspective view and start executing actions.

Note: It may be useful to use the Symbol Viewer plugin to view more details about the state of the system.

The system consists of four entity types:
1) Processor - this entity has a limited amount of CPU and memory and has the ability to break if these are used up.
2) Job - these have a defined amount of CPU and memory they consume when scheduled. After processing these entities have an action to delete themselves.
3) User - these entities submit jobs by instantiating entities with different parameters for the amounts of CPU and memory required.
4) Sysadmin - this entity is able to remove and instantiate a new processor entity if the existing entity breaks.

This model illustrates the uses of actions that are able to delete and instantiate parameterised entities. Further entities may be added into the system at any time by the human 'superuser' through the Template Instantiation view.
