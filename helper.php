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
	
	public function convertToDOM($result){
		if((!empty($result))&&(is_array($result))){
			foreach($result as $key => $value){
				switch($key){
					case"file":
						unset($result[$key]);
						break;
					default:
						break;
				}
			}
		}
    return $result;
  }
}
