		              使用PHP操作svn
环境 ： ubuntu

前言： 开发的时候，常常使用svn做为版本管理软件，但本地每次上传时如果要更新到线上，则会到线上更新，为此会变得非常麻烦。

权限问题：
	提示：“SVN locked , clean up“ ， 或者 “Permission denied”
    
        原因： php的代码在服务器上是以apache/nginx的用户去执行的。所以，我们要将需要操作的目录设置成apache/nginx可以去操作。
	
	操作：1， 查看服务器是以哪个用户去执行，如 www
	      2,  找到所要操作的目录，执行 ls -l 查看目录所属者
	      3,  设置目录权限： chown -R www:www dir  (此处可以用组，组内可操作)