<?php    
$result = shell_exec('svn update /var/www/vipyunfu/  2>&1');    
var_dump($result);   
