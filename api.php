<?php
class filesAPI extends APIextend {

  public function upload($request = null, $data = null){
    if(isset($data)){
      if(!is_array($data)){ $data = json_decode($data, true); }
			$file['encoding'] = trim(explode(",",$data['dataURL'])[0],' ');
			if(strpos($file['encoding'],'base64') !== false){ $file['file'] = base64_decode(trim(explode(",",$data['dataURL'])[1],' ')); }
			else { $file['file'] = trim(explode(",",$data['dataURL'])[1],' '); }
      unset($data['dataURL']);
      $file["checksum"] = md5($file["file"]);
      $filename = explode('.',$data['filename']);
      $file['name'] = $data['filename'];
      $file['filename'] = $data['filename'];
      $file['dirname'] = '';
      $file['type'] = end($filename);
      $file['size'] = $data['size'];
      $file['meta'] = '';
      $file['isAttachment'] = '';
      $file['id'] = $this->save($file,["debug" => false]);
      unset($file['file']);
      if($file['id'] != null && $file['id'] != ''){
        $files = $this->Auth->query('SELECT * FROM `files` WHERE `id` = ?',$file['id'])->fetchAll()->all();
        if(!empty($files)){
          $file = $files[0];
          unset($file['file']);
          $this->createRelationship([
            'relationship_1' => $data['relationship'],
            'link_to_1' => $data['link_to'],
            'relationship_2' => 'files',
            'link_to_2' => $file['id'],
          ]);
          $return = [
            "success" => $this->Language->Field["File saved!"],
            "request" => $request,
            "data" => $data,
            "output" => [
              'file' => $file,
            ],
          ];
        } else {
          $return = [
            "error" => $this->Language->Field["Unable to read file"],
            "request" => $request,
            "data" => $data,
          ];
        }
      } else {
        $return = [
          "error" => $this->Language->Field["Unable to save file"],
          "request" => $request,
          "data" => $data,
        ];
      }
    } else {
			$return = [
				"error" => $this->Language->Field["Unable to complete the request"],
				"request" => $request,
				"data" => $data,
			];
		}
		return $return;
  }

  public function delete($request = null, $data = null){
		if(($data != null)||($data == null)){
			if(!is_array($data)){ $data = json_decode($data, true); }
      // Fetch File
      $files = $this->Auth->query('SELECT * FROM `files` WHERE `id` = ?',$data['id'])->fetchAll()->all();
      if(!empty($files)){
        $file = $files[0];
        // Delete File from DB
        $this->Auth->delete('files',$file['id']);
        // Fetch Relationships
        $relationships = $this->getRelationships('files',$file['id']);
        // Delete Relationships
        if((isset($relationships))&&(!empty($relationships))){
          foreach($relationships as $id => $links){
            $this->Auth->delete('relationships',$id);
          }
        }
        // Delete File from Filesystem
        if(is_file($file['dirname'].'/'.$file['filename'])){
          unlink($file['dirname'].'/'.$file['filename']);
        }
        $results = [
          "success" => $this->Language->Field["Your file is ready!"],
          "request" => $request,
          "data" => $data,
          "output" => [
            'file' => $file,
          ],
        ];
      } else {
        $results = [
  				"error" => $this->Language->Field["File not found!"],
  				"request" => $request,
  				"data" => $data,
  			];
      }
    } else {
			$results = [
				"error" => $this->Language->Field["Unable to complete the request"],
				"request" => $request,
				"data" => $data,
			];
		}
		return $results;
  }

  public function download($request = null, $data = null){
		if(($data != null)||($data == null)){
			if(!is_array($data)){ $data = json_decode($data, true); }
      $files = $this->Auth->query('SELECT * FROM `files` WHERE `id` = ?',$data['id'])->fetchAll()->all();
      if(!empty($files)){
        $file = $files[0];
        if(!isset($file['dirname']) || empty($file['dirname']) || $file['dirname'] == ''){
          $file['dirname'] = 'data/files/'.$file['id'];
          $this->save($file,["force" => true, "debug" => false]);
        }
        if(!is_file($file['dirname'].'/'.$file['filename'])){
          if(!is_dir($file['dirname']) && !is_file($file['dirname'])){
            $this->mkdir($file['dirname']);
          }
          $write = fopen($file['dirname'].'/'.$file['filename'], "w");
          fwrite($write, $file['file']);
          fclose($write);
        }
        unset($file['file']);
        $results = [
          "success" => $this->Language->Field["Your file is ready!"],
          "request" => $request,
          "data" => $data,
          "output" => [
            'file' => $file,
          ],
        ];
      } else {
        $results = [
  				"error" => $this->Language->Field["File not found!"],
  				"request" => $request,
  				"data" => $data,
  			];
      }
    } else {
			$results = [
				"error" => $this->Language->Field["Unable to complete the request"],
				"request" => $request,
				"data" => $data,
			];
		}
		return $results;
  }

  public function save($file,$options = []){
    if(!isset($this->Settings['plugins']['files']['settings']['blacklist'])||(isset($this->Settings['plugins']['files']['settings']['blacklist']) && is_array($this->Settings['plugins']['files']['settings']['blacklist']) && !in_array($file['type'], $this->Settings['plugins']['files']['settings']['blacklist']))){
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
      if(isset($this->Settings['debug']) && $this->Settings['debug'] && (!isset($options['debug']) || (isset($options['debug']) && $options['debug']))){ echo "[".$file["type"]."]This file type blacklisted\n"; }
    }
  }
}
