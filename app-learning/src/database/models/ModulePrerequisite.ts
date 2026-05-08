import { Model } from '@nozbe/watermelondb';
import { immutableRelation } from '@nozbe/watermelondb/decorators';
import type { Associations } from '@nozbe/watermelondb/Model';
import type Relation from '@nozbe/watermelondb/Relation';
import type Module from './Module';

export default class ModulePrerequisite extends Model {
  static table = 'module_prerequisites' as const;

  static associations: Associations = {
    modules: { type: 'belongs_to', key: 'module_id' },
  };

  @immutableRelation('modules', 'module_id') module!: Relation<Module>;
  @immutableRelation('modules', 'prerequisite_module_id') prerequisiteModule!: Relation<Module>;
}
