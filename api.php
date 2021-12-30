<?php
class filesAPI extends APIextend {

  public function download($request = null, $data = null){
		if(($data != null)||($data == null)){
			if(!is_array($data)){ $data = json_decode($data, true); }
      $files = $this->Auth->query('SELECT * FROM `files` WHERE `id` = ?',$data['id'])->fetchAll()->all();
      if(empty($files)){
        $file = $files[0];
        if(!isset($file['dirname']) || empty($file['dirname']) || $file['dirname'] == ''){
          $file['dirname'] = 'data/files/'.$file['id'];
          $this->save($file);
        }
        if(!is_dir($file['dirname']) && !is_file($file['dirname'])){
          $this->mkdir('/'.$file['dirname']);
        }
        if(!is_file($file['dirname'].'/'.$file['filename'])){
          $write = fopen($file['dirname'].'/'.$file['filename'], "w");
          fwrite($write, $file['file']);
          fclose($write);
        }
        unset($file['file']);
        $results = [
          "success" => $this->Language->Field["Your download is ready!"],
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
          "output" => [
            'files' => $files,
          ],
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

  public function save($file){
    if(!isset($this->Settings['plugins']['files']['settings']['blacklist'])||(isset($this->Settings['plugins']['files']['settings']['blacklist']) && is_array($this->Settings['plugins']['files']['settings']['blacklist']) && !in_array($file['type'], $this->Settings['plugins']['files']['settings']['blacklist']))){
      $md5 = md5($file["file"]);
      $files = $this->Auth->query('SELECT * FROM `files` WHERE `checksum` = ? OR (`filename` = ? AND `size` = ?) OR (`name` = ? AND `size` = ?)',$md5,$file["filename"],$file["size"],$file["name"],$file["size"])->fetchAll()->all();
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
          $md5,
          $file["file"],
          $file["type"],
          $file["size"],
          $file["encoding"],
          $file["meta"],
          $file["isAttachment"]
        );
        set_time_limit(20);
        $fileID = $query->dump()['insert_id'];
        if(isset($this->Settings['debug']) && $this->Settings['debug']){ echo "[".$fileID."]File ".$file["filename"]." saved\n"; }
        return $fileID;
      } else {
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
        if(isset($this->Settings['debug']) && $this->Settings['debug']){ echo "[".$files[0]['id']."]File ".$file["filename"]." found\n"; }
        return $files[0]['id'];
      }
    } else {
      if(isset($this->Settings['debug']) && $this->Settings['debug']){ echo "[".$file["type"]."]This file type blacklisted\n"; }
    }
  }
}
