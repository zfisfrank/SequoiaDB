(function(){
   var sacApp = window.SdbSacManagerModule ;
   //全局模板
   sacApp.controller( 'Index.Ctrl', function( $scope, $window, $rootScope, $location, Tip, SdbFunction, Loading, SdbRest ){

      //校验登录信息
      if( SdbFunction.LocalData( 'SdbUser' ) === null || SdbFunction.LocalData( 'SdbSessionID' ) === null )
		{
			window.location.href = '/login.html' ;
         return;
      }
      //设置默认语言
      if( SdbFunction.LocalData( 'SdbLanguage' ) == null )
      {
         SdbFunction.LocalData( 'SdbLanguage', 'zh-CN' ) ;
      }
      //预加载模板
      $scope.Templates = {} ;
      $scope.Templates.Top = './app/template/Public/Top.html' ;
      $scope.Templates.Left = './app/template/Public/Left.html' ;
      $scope.Templates.Bottom = './app/template/Public/Bottom.html' ;
      //获取语言
      $scope.Language = SdbFunction.LocalData( 'SdbLanguage' ) ;
      //初始化提示标签
      Tip.create() ;
      Tip.auto() ;
      //-------- 全局变量 ---------
      $rootScope.Url = { Module: '', Action: '', Method: '' } ;
      //临时存储, 用于跨页用
      $rootScope.TempStorage = {} ;
      //用于触发自定义重绘
      $rootScope.onResize = 0 ;
      //当前所有任务的列表
      $rootScope.OmTaskList = [] ;
      //用于获取窗口宽度
      $rootScope.WindowWidth = $( 'body' ).width() ;
      //用于获取窗口高度
      $rootScope.WindowHeight = $( 'body' ).height() ;
      //-------- 全局组件 ---------
      $rootScope.Components = {} ;
      //错误信息的窗体
      $rootScope.Components.Confirm = {} ;
      //子窗口的窗体
      $rootScope.Components.Modal = {} ;
      //落地窗的窗体
      $rootScope.Components.French = {} ;
      //排版参数
      $rootScope.layout = {} ;
      $rootScope.layout.top     = { height: 40 } ;
      $rootScope.layout.content = { offsetY: -40 } ;
      $rootScope.layout.bottom  = { height: 40 } ;
      $rootScope.layout.left    = { width: 260 } ;
      $rootScope.layout.centre  = { offsetX: -260, marginLeft: 260 } ;
      //-------- 全局函数 ---------
      //格式化
      $rootScope.sprintf = sprintf ;
      //判断数组
      $rootScope.isArray = isArray ;
      //Json转字符串
      $rootScope.json2String = JSON.stringify ;
      //数值补位
      $rootScope.pad = pad ;
      //语言控制
      $rootScope.autoLanguage = function( text ){
         return _IndexPublic.languageCtrl( $scope, text ) ;
      }
      $rootScope.autoLanguage('确定') ;//马上调用，原因是firefox有bug，如果不调用会造成后续子页面加载后不执行代码。
      //读写临时存储
      $rootScope.tempData = function( domain, key, value ){
         if( typeof( key ) == 'undefined' && typeof( value ) == 'undefined' )
         {
            if( typeof( $rootScope.TempStorage[domain] ) == 'undefined' )
            {
               return ;
            }
            $rootScope.TempStorage[domain] = {} ;
         }
         else if( typeof( value ) == 'undefined' )
         {
            if( typeof( $rootScope.TempStorage[domain] ) == 'undefined' )
            {
               return null ;
            }
            return typeof( $rootScope.TempStorage[domain][key] ) == 'undefined' ? null : $rootScope.TempStorage[domain][key] ;
         }
         else
         {
            if( typeof( $rootScope.TempStorage[domain] ) == 'undefined' )
            {
               $rootScope.TempStorage[domain] = {} ;
            }
            $rootScope.TempStorage[domain][key] = value ;
         }
      }
      //初始化导航（实际实现在下面Left）
      $rootScope.initNav = function(){} ;
      //更新导航(实际实现在下面Left)
      $rootScope.updateNav = function(){} ;
      //更新Url变量
      $rootScope.updateUrl = function(){
         var url   = $location.url() ;
         if( url.indexOf( '?' ) >= 0 )
         {
            url = url.split( '?' )[0] ;
         }
         var route = url.split( '/' ) ;
         $rootScope.Url.Module = route[1] ;
         $rootScope.Url.Action = route[2] ;
         $rootScope.Url.Method = route[3] ;
      } ;
      //触发自定义的onResize
      $rootScope.bindResize = function(){
         var random = 0 ;
         while( random == $rootScope.onResize ) random = Math.random() ;
         $rootScope.onResize = random ;
      } ;
      //禁止F5做全局刷新，改成局部刷新
      $(document).bind("keydown",function(e){
         switch( e.keyCode )  
         {
         case 116:
            if( $rootScope.Url.Module == 'Deploy' )
            {
               var params = { 'r': new Date().getTime() } ;
               $location.path( $location.path() ).search( params ) ;
               e.keyCode = 0;
               return false;
            }
            break ;
         }
      } ) ;
      angular.element( $window ).bind( 'resize', function(){
         $rootScope.WindowWidth = $( 'body' ).width() ;
         $rootScope.WindowHeight = $( 'body' ).height() ;
      } ) ;

      var getOMSysInfo = function(){
         var data = { 'cmd': 'get system info' } ;
         SdbRest.OmOperation( data, {
            'success': function( systemInfo ){
               $.each( systemInfo[0], function( key, value ){
                  window.Config[ key ] = value ;
               } ) ;
               window.Config['recv'] = true ;
            },
            'failed': function( errorInfo ){
               _IndexPublic.createRetryModel( $scope, errorInfo, function(){
                  getOMSysInfo() ;
                  return true ;
               } ) ;
            }
         } ) ;
      }
      getOMSysInfo() ;
   } ) ;

   //顶部
   sacApp.controller( 'Index.Top.Ctrl', function( $scope, $location, $compile, $rootScope, SdbFunction, SdbRest ){

      var data = {
         'cmd': 'query task',
         'filter': JSON.stringify( { 'TaskName': { '$ne': 'SSQL_EXEC' } } ),
         'selector': JSON.stringify( { 'TaskID': 1, 'TaskName': 1, 'TaskID': 1, 'Info.BusinessName': 1, 'Progress': 1, 'Status': 1, 'errno': 1 } ),
         'sort': JSON.stringify( { 'Status': 1, 'TaskID': -1 } ),
         'returnnum': 50
      } ;

      $scope.Top = {} ;
      $scope.Top.TaskList = [] ;
      $scope.Top.ExecTaskNum = 0 ;

      //修改密码弹窗
      $scope.Top.ShowChangePasswd = function(){
         _IndexTop.createPasswdModel( $scope, SdbRest ) ;
      }
      //登出
      $scope.Top.Logout = function(){
         _IndexTop.logout( $location, SdbFunction ) ;
      }

      $scope.Top.UserOperateMenu = [
         { 'html': $compile( '<div style="padding:5px 10px;" ng-click="Top.ShowChangePasswd()">' + $scope.autoLanguage( '修改密码' ) + '</div>' )( $scope ) },
         { 'html': $compile( '<div style="padding:5px 10px;" ng-click="Top.Logout()">' + $scope.autoLanguage( '注销' ) + '</div>' )( $scope ) }
      ] ;

      var NoticeFrench = {
         'title': $scope.autoLanguage( '通知列表' ),
         'empty': $scope.autoLanguage( '没有消息' ),
         'html': null
      } ;

      $scope.Components.French.TaskList = [] ;

      //创建 任务 落地窗
      $scope.CreateTaskFrench = function(){
         $scope.Components.French.GotoTaskPage = function( taskInfo ){
            $rootScope.tempData( 'Deploy', 'Model', 'Task' ) ;
            $rootScope.tempData( 'Deploy', 'Module', 'None' ) ;
            var params = { 'r': new Date().getTime() } ;
            if( taskInfo['TaskName'] == 'ADD_HOST' || taskInfo['TaskName'] == 'REMOVE_HOST' )
            {
               $rootScope.tempData( 'Deploy', 'HostTaskID', taskInfo['TaskID'] ) ;
               $location.path( '/Deploy/InstallHost' ).search( params ) ;
            }
            else
            {
               $rootScope.tempData( 'Deploy', 'ModuleTaskID', taskInfo['TaskID'] ) ;
               $location.path( '/Deploy/InstallModule' ).search( params ) ;
            }
         }
         $scope.Components.French.title = $scope.autoLanguage( '任务列表' ) ;
         $scope.Components.French.empty = $scope.autoLanguage( '没有任务' ) ;
         $scope.Components.French.Context = '\
<div>\
   <div class="linkButton frenchWindowBox" ng-repeat="taskInfo in data.TaskList track by $index" ng-click="data.GotoTaskPage(taskInfo)">\
      <div class="Ellipsis frenchWindowText">{{taskInfo[\'TaskID\']}} {{taskInfo[\'TaskName\']}}</div>\
      <div progress-bar="taskInfo[\'barChart\']"></div>\
   </div>\
</div>' ;
         $scope.Components.French['isShow'] = true ;
      }

      SdbRest.OmOperation( data, {
         'success': function( taskList ){
            $rootScope.OmTaskList = taskList ;
            $scope.Top.ExecTaskNum = 0 ;
            $.each( taskList, function( index, taskInfo ){
               if( taskInfo['errno'] == 0 )
               {
                  if( taskInfo['Status'] == 4 )
                  {
                     taskList[index]['barChart'] = { 'percent': taskInfo['Progress'], 'style': { 'progress': { 'background': '#00CC66' } } } ;
                  }
                  else
                  {
                     if( taskInfo['Progress'] == 100 )
                     {
                        taskInfo['Progress'] = 90 ;
                     }
                     ++$scope.Top.ExecTaskNum ;
                     if( taskInfo['Status'] == 2 )
                     {
                        taskList[index]['barChart'] = { 'percent': taskInfo['Progress'], 'style': { 'progress': { 'background': '#FF9933' } } } ;
                     }
                     else
                     {
                        taskList[index]['barChart'] = { 'percent': taskInfo['Progress'], 'style': { 'progress': { 'background': '#188FF1' } } } ;
                     }
                  }
               }
               else
               {
                  taskList[index]['barChart'] = { 'percent': 100, 'style': { 'progress': { 'background': '#D9534F' } } } ;
               }
               $scope.Components.French.TaskList = taskList ;
               $scope.Top.TaskList = taskList ;
            } ) ;
         }
      }, {
         'showLoading': false,
         'delay': 5000,
         'loop': true,
         'scope': false
      } ) ;
   } ) ;
   //左边
   sacApp.controller( 'Index.Left.Ctrl', function( $scope, $rootScope, $location, SdbRest, SdbFunction ){
      $scope.showModuleIndex = -1 ;
      $scope.Left = {} ;
      $scope.Left.nav1 = { width: 80 } ;
      $scope.Left.nav2 = { width: 180, marginLeft: 80 } ;
      $scope.Left.nav2Show = true ;
      $scope.Left.nav1Btn = { 'visibility': 'hidden' } ;
      $scope.Left.nav2Btn = { 'visibility': 'hidden' } ;
      //初始化导航列表
      $rootScope.initNav = function(){
         if( window.Config['Edition'] == 'Enterprise' )
         {
            $scope.Left.navMenu = [
               {
                  'text': $scope.autoLanguage( '数据' ),
                  'module': 'Data',
                  'icon': 'fa-database',
                  'list': [
                     {
                        'title': 'SequoiaDB',
                        'list': []
                     },
                     {
                        'title': 'SequoiaSQL',
                        'list': []
                     },
                     {
                        'title': 'Hdfs',
                        'list': []
                     },
                     {
                        'title': 'Spark',
                        'list': []
                     },
                     {
                        'title': 'Yarn',
                        'list': []
                     }
                  ]
               },
               {
                  'text': $scope.autoLanguage( '监控' ),
                  'module': 'Monitor',
                  'icon': 'fa-flash',
                  'list': [
                     {
                        'title': 'SequoiaDB',
                        'list': []
                     }
                  ]
               },
               {
                  'text': $scope.autoLanguage( '部署' ),
                  'module': 'Deploy',
                  'icon': 'fa-share-alt',
                  'action': '/#/Deploy/Index'
               }
            ] ;
         }
         else
         {
            $scope.Left.navMenu = [
               {
                  'text': $scope.autoLanguage( '数据' ),
                  'module': 'Data',
                  'icon': 'fa-database',
                  'list': [
                     {
                        'title': 'SequoiaDB',
                        'list': []
                     },
                     {
                        'title': 'SequoiaSQL',
                        'list': []
                     },
                     {
                        'title': 'Hdfs',
                        'list': []
                     },
                     {
                        'title': 'Spark',
                        'list': []
                     },
                     {
                        'title': 'Yarn',
                        'list': []
                     }
                  ]
               },
               {
                  'text': $scope.autoLanguage( '监控' ),
                  'module': 'Monitor',
                  'icon': 'fa-flash',
                  'list': [
                     {
                        'title': 'SequoiaDB',
                        'list': []
                     }
                  ]
               },
               {
                  'text': $scope.autoLanguage( '部署' ),
                  'module': 'Deploy',
                  'icon': 'fa-share-alt',
                  'action': '/#/Deploy/Index'
               }
            ] ;
         }
      } ;
      $rootScope.initNav() ;

      $rootScope.updateNav = function( updateDefault ){
         if( updateDefault && $rootScope.Url.Module == 'Deploy' )
         {
            $rootScope.layout.left    = { width: 80 } ;
            $rootScope.layout.centre  = { offsetX: -80, marginLeft: 80 } ;
            $scope.Left.nav2 = { width: 0, marginLeft: 0 } ;
            $scope.Left.nav2Show = false ;
         }
         _IndexLeft.updateNav( $scope, $rootScope, SdbRest,  function( instanceList, navMenu ){
            if( updateDefault == true )
            {
               $scope.cursorIndex = _IndexLeft.getActiveIndex( $rootScope, SdbFunction, navMenu ) ;
               if( $scope.showModuleIndex == -1 )
               {
                  $scope.showModuleIndex = $scope.cursorIndex[0] ;
               }
               if( $scope.Left.navMenu[ $scope.showModuleIndex ]['module'] == 'Deploy' )
               {
                  $scope.Left.nav1Btn = { 'visibility': 'hidden' } ;
                  $scope.Left.nav2Btn = { 'visibility': 'hidden' } ;
               }
               else
               {
                  if( $scope.Left.nav2Show )
                  {
                     $scope.Left.nav1Btn = { 'visibility': 'hidden' } ;
                     $scope.Left.nav2Btn = { 'visibility': 'visible' } ;
                  }
                  else
                  {
                     $scope.Left.nav1Btn = { 'visibility': 'visible' } ;
                     $scope.Left.nav2Btn = { 'visibility': 'hidden' } ;
                  }
               }
            }
         } ) ;
      } ;

      //更新url地址信息
      $rootScope.updateUrl() ;

      /*if( $rootScope.Url.Module == 'Deploy' )
      {
         $rootScope.layout.left    = { width: 80 } ;
         $rootScope.layout.centre  = { offsetX: -80, marginLeft: 80 } ;
         $scope.Left.nav2 = { width: 0, marginLeft: 0 } ;
         $scope.Left.nav2Show = false ;
      }*/

      //更新导航
      $rootScope.updateNav( true ) ;

      $scope.toggleNav2 = function(){
         if( $scope.Left.nav2Show == true )
         {
            $scope.Left.nav1Btn = { 'visibility': 'visible' } ;
            $scope.Left.nav2Btn = { 'visibility': 'hidden' } ;
            $rootScope.layout.left    = { width: 80 } ;
            $rootScope.layout.centre  = { offsetX: -80, marginLeft: 80 } ;
            $scope.Left.nav2 = { width: 0, marginLeft: 0 } ;
         }
         else
         {
            $scope.Left.nav1Btn = { 'visibility': 'hidden' } ;
            $scope.Left.nav2Btn = { 'visibility': 'visible' } ;
            $rootScope.layout.left    = { width: 260 } ;
            $rootScope.layout.centre  = { offsetX: -260, marginLeft: 260 } ;
            $scope.Left.nav1 = { width: 80 } ;
            $scope.Left.nav2 = { width: 180, marginLeft: 80 } ;
         }
         $scope.Left.nav2Show = !$scope.Left.nav2Show ;
         $rootScope.bindResize() ;
      }

      $rootScope.gotoModule = function( moduleIndex, activeIndex, instanceIndex ){
         var clusterName = $scope.Left.navMenu[ moduleIndex ]['list'][ activeIndex ]['list'][ instanceIndex ]['cluster'] ;
         var moduleName  = $scope.Left.navMenu[ moduleIndex ]['list'][ activeIndex ]['list'][ instanceIndex ]['name'] ;
         var moduleType  = $scope.Left.navMenu[ moduleIndex ]['list'][ activeIndex ]['list'][ instanceIndex ]['type'] ;
         var moduleMode  = $scope.Left.navMenu[ moduleIndex ]['list'][ activeIndex ]['list'][ instanceIndex ]['mode'] ;
         SdbFunction.LocalData( 'SdbClusterName', clusterName ) ;
         SdbFunction.LocalData( 'SdbModuleType', moduleType ) ;
         SdbFunction.LocalData( 'SdbModuleMode', moduleMode ) ;
         SdbFunction.LocalData( 'SdbModuleName', moduleName ) ;
         var params = { 'r': new Date().getTime() } ;
         if( $scope.Left.navMenu[ moduleIndex ]['module'] == 'Data' )
         {
            switch( moduleType )
            {
            case 'sequoiadb':
               $location.path( '/Data/SDB-Database/Index' ).search( params ) ; break ;
            case 'sequoiasql':
               if( window.Config['Edition'] == 'Enterprise' )
               {
                  if( moduleMode == '' || moduleMode == 'oltp' )
                  {
                     $location.path( '/Data/SQL-Metadata/Index' ).search( params ) ; break ;
                  }
                  else
                  {
                     $location.path( '/Data/NotSupport' ).search( params ) ; break ;
                  }
               }
               else
               {
                  $location.path( '/Data/Edition' ).search( params ) ; break ;
               }
            case 'hdfs':
               $location.path( '/Data/HDFS-web/Index' ).search( params ) ; break ;
            case 'spark':
               $location.path( '/Data/SPARK-web/Index' ).search( params ) ; break ;
            case 'yarn':
               $location.path( '/Data/YARN-web/Index' ).search( params ) ; break ;
            default:
               break ;
            }
         }
         else if( $scope.Left.navMenu[ moduleIndex ]['module'] == 'Monitor' )
         {
            switch( moduleType )
            {
            case 'sequoiadb':
               /*
               if( window.Config['Edition'] == 'Enterprise' )
               {
                  $location.path( '/Monitor/SDB/Index' ).search( params ) ; break ;
               }
               else
               {
                  $location.path( '/Monitor/Preview' ).search( params ) ; break ;
               }
               */
               $location.path( '/Monitor/SDB/Index' ).search( params ) ; break ;
            default:
               break ;
            }
         }
         else if( $scope.Left.navMenu[ moduleIndex ]['module'] == 'Strategy' )
         {
            switch( moduleType )
            {
            case 'sequoiadb':
               $location.path( '/Strategy/SDB/Index' ).search( params ) ; break ;
            default:
               break ;
            }
         }
         $scope.cursorIndex[0] = moduleIndex ;
         $scope.cursorIndex[1] = activeIndex ;
         $scope.cursorIndex[2] = instanceIndex ;
      }

      $rootScope.$on( '$locationChangeStart', function( event, newUrl, oldUrl ){
         printfDebug( '切换路由 ' + newUrl + ' form ' + oldUrl ) ;
         $rootScope.updateUrl() ;
         $scope.cursorIndex = _IndexLeft.getActiveIndex( $rootScope, SdbFunction, $scope.Left.navMenu ) ;
         $scope.showModuleIndex = $scope.cursorIndex[0] ;
         if( $scope.Left.navMenu[ $scope.showModuleIndex ]['module'] == 'Deploy' )
         {
            $scope.Left.nav1Btn = { 'visibility': 'hidden' } ;
            $scope.Left.nav2Btn = { 'visibility': 'hidden' } ;
            $rootScope.layout.left    = { width: 80 } ;
            $rootScope.layout.centre  = { offsetX: -80, marginLeft: 80 } ;
            $scope.Left.nav2 = { width: 0, marginLeft: 0 } ;
            $scope.cursorIndex[1] = -1 ;
            $scope.cursorIndex[2] = -1 ;
         }
         else if( $scope.Left.nav2Show == false && $scope.Left.nav1Btn['visibility'] == 'visible' )
         {
         }
         else
         {
            $scope.Left.nav1Btn = { 'visibility': 'hidden' } ;
            $scope.Left.nav2Btn = { 'visibility': 'visible' } ;
            $rootScope.layout.left    = { width: 260 } ;
            $rootScope.layout.centre  = { offsetX: -260, marginLeft: 260 } ;
            $scope.Left.nav1 = { width: 80 } ;
            $scope.Left.nav2 = { width: 180, marginLeft: 80 } ;
            $scope.Left.nav2Show = true ;
         }
      } ) ;

      $scope.selectLeftModule = function( moduleIndex ){
         $scope.showModuleIndex = moduleIndex ;
         $rootScope.bindResize() ;
         if( $scope.Left.navMenu[ $scope.showModuleIndex ]['module'] == 'Deploy' )
         {
            $scope.Left.nav1Btn = { 'visibility': 'hidden' } ;
            $scope.Left.nav2Btn = { 'visibility': 'hidden' } ;
            $rootScope.layout.left    = { width: 80 } ;
            $rootScope.layout.centre  = { offsetX: -80, marginLeft: 80 } ;
            $scope.Left.nav2 = { width: 0, marginLeft: 0 } ;
            $scope.cursorIndex[1] = -1 ;
            $scope.cursorIndex[2] = -1 ;
         }
         else
         {
            $scope.Left.nav1Btn = { 'visibility': 'hidden' } ;
            $scope.Left.nav2Btn = { 'visibility': 'visible' } ;
            $rootScope.layout.left    = { width: 260 } ;
            $rootScope.layout.centre  = { offsetX: -260, marginLeft: 260 } ;
            $scope.Left.nav1 = { width: 80 } ;
            $scope.Left.nav2 = { width: 180, marginLeft: 80 } ;
            $scope.Left.nav2Show = true ;
         }
      }
   } ) ;
   //底部
   sacApp.controller( 'Index.Bottom.Ctrl', function( $scope, SdbRest ){
      $scope.Bottom = {} ;
      //获取系统时间
      _IndexBottom.getSystemTime( $scope ) ;
      //获取系统状态
      _IndexBottom.checkPing( $scope, SdbRest ) ;
   } ) ;
}());