<?php
class filesAPI extends APIextend {
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
          `checksum`,
          `file`,
          `type`,
          `size`,
          `encoding`,
          `meta`,
          `isAttachment`
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)',
          date("Y-m-d H:i:s"),
          date("Y-m-d H:i:s"),
          $this->Auth->User['id'],
          $this->Auth->User['id'],
          $file["name"],
          $file["filename"],
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
        if(isset($this->Settings['debug']) && $this->Settings['debug']){ echo "[".$files[0]['id']."]File ".$file["filename"]." found\n"; }
        return $files[0]['id'];
      }
    } else {
      if(isset($this->Settings['debug']) && $this->Settings['debug']){ echo "[".$file["type"]."]This file type blacklisted\n"; }
    }
  }
}
