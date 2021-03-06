/*******************************************************************************


   Copyright (C) 2011-2014 SequoiaDB Ltd.

   This program is free software: you can redistribute it and/or modify
   it under the term of the GNU Affero General Public License, version 3,
   as published by the Free Software Foundation.

   This program is distributed in the hope that it will be useful,
   but WITHOUT ANY WARRANTY; without even the implied warrenty of
   MARCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
   GNU Affero General Public License for more details.

   You should have received a copy of the GNU Affero General Public License
   along with this program. If not, see <http://www.gnu.org/license/>.

   Source File Name = netFrame.hpp

   Descriptive Name =

   When/how to use: this program may be used on binary and text-motionatted
   versions of PD component. This file contains declare of PD functions.

   Dependencies: N/A

   Restrictions: N/A

   Change Activity:
   defect Date        Who Description
   ====== =========== === ==============================================
          09/14/2012  YW  Initial Draft

   Last Changed =

*******************************************************************************/

#ifndef NETFRAME_HPP_
#define NETFRAME_HPP_

#include "core.hpp"
#include "oss.hpp"
#include "netDef.hpp"
#include "ossLatch.hpp"
#include "netEventHandler.hpp"
#include "netTimer.hpp"
#include "ossAtomic.hpp"

#include <map>
#include <boost/shared_ptr.hpp>
#include <boost/asio.hpp>

using namespace std ;
namespace engine
{
   class _netMsgHandler ;
   class _netFrame ;

   /*
      _netInnerTimeHandle define
   */
   class _netInnerTimeHandle : public _netTimeoutHandler
   {
      public:
         _netInnerTimeHandle( _netFrame *pFrame ) ;
         virtual ~_netInnerTimeHandle() ;

         virtual void handleTimeout( const UINT32 &millisec,
                                     const UINT32 &id ) ;

      public:
         void         setInfo( const CHAR *pHostName,
                               const CHAR *pSvcName ) ;

         void         startTimer() ;

      private:
         _netFrame            *_pFrame ;
         UINT32               _timeID ;
         string               _hostName ;
         string               _svcName ;
   } ;
   typedef _netInnerTimeHandle netInnerTimeHandle ;

   #define NET_HEARTBEAT_INTERVAL            ( 5000 )

   /*
      _netFrame define
   */
   class _netFrame : public SDBObject
   {
      friend class _netInnerTimeHandle ;
      public:
         _netFrame( _netMsgHandler *handler ) ;

         ~_netFrame() ;

      public:
         OSS_INLINE io_service &ioservice()
         {
            return _ioservice ;
         }

         OSS_INLINE NET_HANDLE allocateHandle()
         {
            return _handle.inc() ;
         }

         OSS_INLINE void setLocal( const MsgRouteID &id )
         {
            _local = id ;
         }

      public:
         static UINT32 getCurrentLocalAddress() ;
         static UINT32 getLocalAddress() ;

      public:
         void run();

         void stop() ;

         void heartbeat( UINT32 interval, INT32 serviceType = -1 ) ;

         void setBeatInfo( UINT32 beatTimeout,
                           UINT32 beatInteval = 0 ) ;

         NET_EH getEventHandle( const NET_HANDLE &handle ) ;

         INT32 listen( const CHAR *hostName,
                       const CHAR *serviceName ) ;

         INT32 syncConnect( const CHAR *hostName,
                            const CHAR *serviceName,
                            const _MsgRouteID &id ) ;

         INT32 syncSend( const NET_HANDLE &handle,
                         void *header ) ;

         INT32 syncSendRaw( const NET_HANDLE &handle,
                            const CHAR *pBuff,
                            UINT32 buffSize ) ;

         INT32 syncSend( const  _MsgRouteID &id,
                         void *header,
                         NET_HANDLE *pHandle = NULL ) ;

         INT32 syncSend( const NET_HANDLE &handle,
                         MsgHeader *header,
                         const void *body,
                         UINT32 bodyLen ) ;

         INT32 syncSend( const _MsgRouteID &id,
                         MsgHeader *header,
                         const void *body,
                         UINT32 bodyLen,
                         NET_HANDLE *pHandle = NULL ) ;

         INT32 syncSendv( const _MsgRouteID &id,
                          MsgHeader *header,
                          const netIOVec &iov,
                          NET_HANDLE *pHandle = NULL ) ;

         INT32 syncSendv( const NET_HANDLE &handle,
                          MsgHeader *header,
                          const netIOVec &iov ) ;

         INT32 addTimer( UINT32 millsec, _netTimeoutHandler *handler,
                         UINT32 &timerid );

         INT32 removeTimer( UINT32 timerid ) ;

         void close( const _MsgRouteID &id ) ;

         void close( const NET_HANDLE &handle ) ;

         void close() ;

         void closeListen() ;

         void handleMsg( NET_EH eh ) ;

         void handleClose( NET_EH eh, _MsgRouteID id ) ;

         friend  class _netEventHandler ;

         INT64 netIn() ;

         INT64 netOut() ;

         void resetMon() ;

      private:
         void _asyncAccept() ;
         void _acceptCallback( NET_EH eh,
                               const boost::system::error_code &
                               error ) ;

         void _erase( const NET_HANDLE &handle ) ;

         void _addRoute( NET_EH eh ) ;

         void _heartbeat( INT32 serviceType ) ;

         void _checkBreak( UINT32 timeout, INT32 serviceType ) ;

      private:
         io_service                       _ioservice ;
         multimap<UINT64, NET_EH>         _route ;
         map<NET_HANDLE, NET_EH>          _opposite ;
         map<UINT32, NET_TH>              _timers ;
         _netMsgHandler                   *_handler ;
         MsgRouteID                       _local ;
         _ossSpinSLatch                   _mtx ;
         boost::asio::ip::tcp::acceptor   _acceptor ;
         _ossAtomic32                     _handle ;
         UINT32                           _timerID;
         ossAtomicSigned64                _netOut;
         ossAtomicSigned64                _netIn;

         UINT32                           _beatInterval ;
         UINT32                           _beatTimeout ;
         UINT64                           _beatLastTick ;
         BOOLEAN                          _checkBeat ;

         netInnerTimeHandle               _innerTimeHandle ;

   } ;

}

#endif

