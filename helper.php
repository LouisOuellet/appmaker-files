<?php
class filesHelper extends Helper {

	public function buildRelation($relations,$relation){
    if(isset($relations[$relation['relationship']][$relation['link_to']]['file'])){
      unset($relations[$relation['relationship']][$relation['link_to']]['file']);
    }
    return $relations;
  }
}
