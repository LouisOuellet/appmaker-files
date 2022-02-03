<?php
class filesHelper extends Helper {

	public function buildRelation($relations){
    if(isset($relations['files'])){
			foreach($relations['files'] as $id => $file){
				unset($relations['files'][$id]['file']);
			}
    }
    return $relations;
  }
}
