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
			if(isset($result['file'])){
				unset($result['file']);
			}
		}
    return $result;
  }

	public function write($file){
		$file['dirname'] = 'data/files/'.$file['id'];
		$this->save($file,["force" => true, "debug" => false]);
		$write = fopen($file['dirname'].'/'.$file['filename'], "w");
		fwrite($write, $file['file']);
		fclose($write);
		return $file['dirname'].'/'.$file['filename'];
	}

	public function cache($file){
		$files = $this->Auth->query('SELECT * FROM `files` WHERE `id` = ?',$file)->fetchAll()->all();
		if(!empty($files)){
			$file = $files[0];
			return $this->write($file);
		}
		return false;
	}

  public function save($file,$options = []){
    if(!isset($this->Settings['plugins']['files']['settings']['blacklist'])||(isset($this->Settings['plugins']['files']['settings']['blacklist']) && is_array($this->Settings['plugins']['files']['settings']['blacklist']) && !in_array($file['type'], $this->Settings['plugins']['files']['settings']['blacklist']))){
      $file['name'] = str_replace('~','',$file['name']);
      $file['filename'] = str_replace('~','',$file['filename']);
      if(!isset($file["id"])){
        if(!isset($file["checksum"])){ $file["checksum"] = md5($file["file"]); }
        $files = $this->Auth->query('SELECT * FROM `files` WHERE `checksum` = ? OR (`filename` = ? AND `size` = ?) OR (`name` = ? AND `size` = ?)',$file["checksum"],$file["filename"],$file["size"],$file["name"],$file["size"])->fetchAll()->all();
        if(empty($files)){
          $query = $this->Auth->query('INSERT INTO `files` (
            `created`,
            `modified`,
            `owner`,
            `updated_by`,
            `name`,
            `filename`,
            `dirname`,
            `checksum`,
            `file`,
            `type`,
            `size`,
            `encoding`,
            `meta`,
            `isAttachment`
          ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
            date("Y-m-d H:i:s"),
            date("Y-m-d H:i:s"),
            $this->Auth->User['id'],
            $this->Auth->User['id'],
            $file["name"],
            $file["filename"],
            $file["dirname"],
            $file["checksum"],
            $file["file"],
            $file["type"],
            $file["size"],
            $file["encoding"],
            $file["meta"],
            $file["isAttachment"]
          );
          set_time_limit(20);
          $fileID = $query->dump()['insert_id'];
          if(isset($this->Settings['debug']) && $this->Settings['debug'] && (!isset($options['debug']) || (isset($options['debug']) && $options['debug']))){ echo "[".$fileID."]File ".$file["filename"]." saved\n"; }
          return $fileID;
        } else {
          if(isset($options['force']) && $options['force']){
            $query = $this->Auth->query('UPDATE `files` SET
              `modified` = ?,
              `updated_by` = ?,
              `name` = ?,
              `filename` = ?,
              `dirname` = ?,
              `checksum` = ?,
              `file` = ?,
              `type` = ?,
              `size` = ?,
              `encoding` = ?,
              `meta` = ?,
              `isAttachment` = ?
            WHERE `id` = ?',[
              date("Y-m-d H:i:s"),
              $this->Auth->User['id'],
              $file["name"],
              $file["filename"],
              $file["dirname"],
              $file["checksum"],
              $file["file"],
              $file["type"],
              $file["size"],
              $file["encoding"],
              $file["meta"],
              $file["isAttachment"],
              $file["id"]
            ]);
            $dump = $query->dump();
          }
          if(isset($this->Settings['debug']) && $this->Settings['debug'] && (!isset($options['debug']) || (isset($options['debug']) && $options['debug']))){ echo "[".$files[0]['id']."]File ".$file["filename"]." found\n"; }
          return $files[0]['id'];
        }
      } else {
        $files = $this->Auth->query('SELECT * FROM `files` WHERE `id` = ?',$file["id"])->fetchAll()->all();
        if(!empty($files)){
          $query = $this->Auth->query('UPDATE `files` SET
            `modified` = ?,
            `updated_by` = ?,
            `name` = ?,
            `filename` = ?,
            `dirname` = ?,
            `checksum` = ?,
            `file` = ?,
            `type` = ?,
            `size` = ?,
            `encoding` = ?,
            `meta` = ?,
            `isAttachment` = ?
          WHERE `id` = ?',[
            date("Y-m-d H:i:s"),
            $this->Auth->User['id'],
            $file["name"],
            $file["filename"],
            $file["dirname"],
            $file["checksum"],
            $file["file"],
            $file["type"],
            $file["size"],
            $file["encoding"],
            $file["meta"],
            $file["isAttachment"],
            $file["id"]
          ]);
          $dump = $query->dump();
          return $file['id'];
        }
      }
    } else {
      if(isset($this->Settings['debug']) && $this->Settings['debug'] && (!isset($options['debug']) || (isset($options['debug']) && $options['debug']))){ echo "[".$file["type"]."]This file type blacklisted\n"; }
    }
  }
}
