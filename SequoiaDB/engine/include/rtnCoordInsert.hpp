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

   Source File Name = rtnCoordInsert.hpp

   Descriptive Name =

   When/how to use:

   Dependencies: N/A

   Restrictions: N/A

   Change Activity:
   defect Date        Who Description
   ====== =========== === ==============================================
          11/28/2012  YW  Initial Draft

   Last Changed =

*******************************************************************************/

#ifndef RTNCOORDINSERT_HPP__
#define RTNCOORDINSERT_HPP__

#include "rtnCoordOperator.hpp"
#include "../bson/bson.h"

using namespace bson ;

namespace engine
{
   class rtnCoordInsert : public rtnCoordTransOperator
   {
   typedef map< string, netIOVec >        SubCLObjsMap ;
   typedef map< UINT32, SubCLObjsMap >    GroupSubCLMap ;

   struct rtnCoordInsertPvtData
   {
      UINT64         _insertMixNum ;   /// InsertedNum(Hi) + IgnoredNum(Lo)
      GroupSubCLMap  _grpSubCLDatas ;

      rtnCoordInsertPvtData()
      {
         _insertMixNum = 0 ;
      }
   } ;

   public:
      virtual INT32 execute( MsgHeader *pMsg,
                             pmdEDUCB *cb,
                             INT64 &contextID,
                             rtnContextBuf *buf ) ;

   private:
      INT32 shardDataByGroup( CoordCataInfoPtr &cataInfo,
                              INT32 count,
                              CHAR *pInsertor,
                              const netIOV &fixed,
                              GROUP_2_IOVEC &datas ) ;

      INT32 shardAnObj( CHAR *pInsertor,
                        CoordCataInfoPtr &cataInfo,
                        const netIOV &fixed,
                        GROUP_2_IOVEC &datas ) ;

      INT32 reshardData( CoordCataInfoPtr &cataInfo,
                         const netIOV &fixed,
                         GROUP_2_IOVEC &datas ) ;

      INT32 shardAnObj( CHAR *pInsertor,
                        CoordCataInfoPtr &cataInfo,
                        pmdEDUCB * cb,
                        GroupSubCLMap &groupSubCLMap ) ;

      INT32 shardDataByGroup( CoordCataInfoPtr &cataInfo,
                              INT32 count,
                              CHAR *pInsertor,
                              pmdEDUCB *cb,
                              GroupSubCLMap &groupSubCLMap ) ;

      INT32 reshardData( CoordCataInfoPtr &cataInfo,
                         pmdEDUCB *cb,
                         GroupSubCLMap &groupSubCLMap ) ;

      INT32 buildInsertMsg( const netIOV &fixed,
                            GroupSubCLMap &groupSubCLMap,
                            vector< BSONObj > &subClInfoLst,
                            GROUP_2_IOVEC &datas ) ;

   protected:

      virtual INT32              _prepareCLOp( CoordCataInfoPtr &cataInfo,
                                               rtnSendMsgIn &inMsg,
                                               rtnSendOptions &options,
                                               netMultiRouteAgent *pRouteAgent,
                                               pmdEDUCB *cb,
                                               rtnProcessResult &result,
                                               ossValuePtr &outPtr ) ;

      virtual void               _doneCLOp( ossValuePtr itPtr,
                                            CoordCataInfoPtr &cataInfo,
                                            rtnSendMsgIn &inMsg,
                                            rtnSendOptions &options,
                                            netMultiRouteAgent *pRouteAgent,
                                            pmdEDUCB *cb,
                                            rtnProcessResult &result ) ;

      virtual INT32              _prepareMainCLOp( CoordCataInfoPtr &cataInfo,
                                                   CoordGroupSubCLMap &grpSubCl,
                                                   rtnSendMsgIn &inMsg,
                                                   rtnSendOptions &options,
                                                   netMultiRouteAgent *pRouteAgent,
                                                   pmdEDUCB *cb,
                                                   rtnProcessResult &result,
                                                   ossValuePtr &outPtr ) ;

      virtual void               _doneMainCLOp( ossValuePtr itPtr,
                                                CoordCataInfoPtr &cataInfo,
                                                CoordGroupSubCLMap &grpSubCl,
                                                rtnSendMsgIn &inMsg,
                                                rtnSendOptions &options,
                                                netMultiRouteAgent *pRouteAgent,
                                                pmdEDUCB *cb,
                                                rtnProcessResult &result ) ;

      virtual void               _prepareForTrans( pmdEDUCB *cb,
                                                   MsgHeader *pMsg ) ;

      virtual void               _onNodeReply( INT32 processType,
                                               MsgOpReply *pReply,
                                               pmdEDUCB *cb,
                                               rtnSendMsgIn &inMsg ) ;

   } ;
}

#endif

