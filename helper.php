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
		// if((!empty($result))&&(is_array($result))){
		// 	if(isset($result['file'])){
		// 		unset($result['file']);
		// 	}
		// }
    // return $result;
  }
}
