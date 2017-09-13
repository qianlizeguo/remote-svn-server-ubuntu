<?php
//操作svn类
class svn {
    private $root = '/var/www/'; //项目所在的根目录
    public  $project_name = ['1' => '微云服'];
    private $project_dir = ['1' => 'vipyunfu'];
    private $dir; //所在操作目录
    public  $status_msg = '无'; //
    public  $error = []; //错误或提示
    private $users = ['wuzeguo', 'wangyineng']; //允许进入的用户
    private $do_type = [1=>'update', 2=>'add', 3=>'commit'];
    private $do; //操作类型
    private $bash; //生成的svn语句

    public function __construct() {
    }

    public function setUsers(array $users) {
        $this->users = $users;
    }

    public function getUsers() {
        return $this->users;
    }

    public function setError(array $error) {
        $this->error = $error;
    }

    public function getError() {
        return $this->error;
    }

    //验证合法性
    public function checkData()
    {
        $this->status_msg = '失败';
        //用户合法
        $this->do = $this->do_type[$_POST['type']];
        if (!in_array($_POST['passport'], $this->users)) {
            $this->error[] = '用户不合法';
        }elseif (!$this->do) {
            $this->error[] = '请选择正确的操作类型';
        }elseif ($thsi->do== 'commit' && !$_POST['dir']) {
            $this->error[] = '请填写目录';
        } else {
            $this->dir = $this->root . $this->project_dir[$_POST['root']] . '/' . trim($_POST['dir']);
            if (!is_dir($this->dir) && !file_exists($this->dir)) $this->error[] = '目录或文件不存在，请重试'; 
        }
    }

    //构造svn语句
    private function createSVN() 
    {
        switch ($this->do) {
        case  'update': 
            $this->bash = 'svn update ' . $this->dir;
            break;
        case 'add':
            $this->bash = 'svn add ' . $this->dir;
            break;
        case 'commit':
            $msg = trim($_POST['message']);
            $msg = $msg ? iconv("UTF-8", "GB2312//IGNORE", $msg) : 'fix';
            $msg = $msg . '  --' . $_POST['passport'];
            $this->bash = 'svn commit -m "' . $msg . '"  ' .  $this->dir;
            break;
        }
    }

    //操作svn
    public function doSVN() {
        $this->checkData();

        if (empty($this->error)) {

            $this->createSVN();
            //echo $this->bash;die;

	    putenv('LANG=C.UTF-8');    
	    exec("$this->bash", $out,$status);
	    var_dump($status);
            var_dump($out);

            if ($status == 0) {
                $this->status_msg = '成功';
            }

            $this->error = $out;
        }
    }

}
