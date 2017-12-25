/**
 * Author : created by GF on 2017.12.22
 * desc : jasgroup appcan baseOperations
 * use : baseOperations.alertToast();
 * 依赖 ： appcan、uexWindow
 */

(function (window, $ ) {
    var protocolConfig = appcan.locStorage.getVal('serverProtocol') || 'http://'; //协议
    var host = appcan.locStorage.getVal('serverIP') || '10.9.8.44'; //主机
    var portConfig = appcan.locStorage.getVal('serverPort') || '8086'; //端口号


    var _base = {
        serverURL: protocolConfig + host + (portConfig ? ':' : '') + portConfig + '/',
        alertToast: function (msg, timeout) {
            if (!msg) return;
            timeout = timeout || 2000;
            uexWindow.toast("0", "5", msg, timeout);
        },
        loadToast: function (msg, timeout) {
            if (!msg) return;
            timeout = timeout || 2000;
            uexWindow.toast("1", "5", msg, timeout);
        },
        closeToast: function () {
            uexWindow.closeToast();
        },
        createUUID: function () {
            var s = [];
            var hexDigits = "0123456789abcdef";
            for (var i = 0; i < 36; i++) {
                s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
            }
            s[14] = "4"; // bits 12-15 of the time_hi_and_version field to 0010
            s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1); // bits 6-7 of the clock_seq_hi_and_reserved to 01
            s[8] = s[13] = s[18] = s[23] = "-";
            var uuid = s.join("");
            return uuid;
        },
        /**
         * 添加过滤emoji监听的方法
         * 可选参数：jqueryDom名称，默认为'input[type="text"],textarea'
         * 原dom已有的oninput事件会冲突
         */
        addEmojiFliterEvent: function (sDomName, callback) {
            var filterEmoji = function (s) { //过滤emoji
                var ranges = [
                    '\ud83c[\udf00-\udfff]',
                    '\ud83d[\udc00-\ude4f]',
                    '\ud83d[\ude80-\udeff]'
                ];
                return s.replace(new RegExp(ranges.join('|'), 'g'), '');
            };

            sDomName = sDomName ? sDomName : 'input[type="text"],textarea';

            $(sDomName).each(function () {
                this.oninput = function () {
                    $(this).val(filterEmoji($(this).val()));
                    if (appcan.isFunction(callback)) {
                        callback(this);
                    }
                };
            });

        },

        /**
         * 对Date的扩展，将 Date 转化为指定格式的String
         * 月(M)、日(d)、小时(h)、分(m)、秒(s)、季度(q) 可以用 1-2 个占位符，
         * 年(y)可以用 1-4 个占位符，毫秒(S)只能用 1 个占位符(是 1-3 位的数字)
         * 例子：
         * _.formatDate(new Date(),"yyyy-MM-dd HH:mm:ss.S") ==> 2006-07-02 08:09:04.423
         * _.formatDate(new Date(),"yyyy-M-d H:m:s.S")      ==> 2006-7-2 8:9:4.18
         * _.formatDate(new Date(),"yyyyMMddHHmmssS")      ==> 20060702080904423
         */
        formatDate: function (dateInst, fmt) {
            var o = {
                "M+": dateInst.getMonth() + 1, //月份
                "d+": dateInst.getDate(), //日
                "H+": dateInst.getHours(), //小时
                "m+": dateInst.getMinutes(), //分
                "s+": dateInst.getSeconds(), //秒
                "q+": Math.floor((dateInst.getMonth() + 3) / 3), //季度
                "S": dateInst.getMilliseconds() //毫秒
            };
            if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (dateInst.getFullYear() + "").substr(4 - RegExp.$1.length));
            for (var k in o)
                if (new RegExp("(" + k + ")").test(fmt)){
                    fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
                }
            return fmt;
        },
        /**
         * 获取元素的当前样式
         * 原理：为元素dom节点添加currentStyle属性，返回当前样式属性集合
         * 例：document.body.currentStyle['width']
         */
        getCurrentFontSize: function (el) {
            var res = appcan.locStorage.getVal('currentFontSize');
            var getElementStyle = function (el, attr) {
                //获取el当前的attr样式，解决ie问题
                return el.currentStyle ? el.currentStyle[attr] : getComputedStyle(el, null)[attr];
            };
            if (res) {
                return res;
            }
            res = getElementStyle(el, 'fontSize').slice(0, -2);
            appcan.locStorage.setVal('currentFontSize', res);
            return res;
        },
        ajax: function (sType, sUrl, oData, fnSuccess, fnFail) {
            if (!sType) {
                alert('请传入类型！');
                return;
            }
            if (!sUrl) {
                alert('请传入url！');
                return;
            }
            var completeURL = this.serverURL;
            appcan.ajax({
                type: sType,
                url: completeURL + sUrl + (sUrl.indexOf("?") !== -1 ? '&' : '?') + 'token=' + appcan.locStorage.getVal("token"),
                data: oData,
                headers: {
                    "Content-type": "application/json;charset=utf-8",
                    "Accept": "*/*"
                }, //设置请求头
                contentType: "application/json;charset=utf-8", //请求时发送的数据格式
                dataType: 'json', //期望服务器返回的数据格式
                timeout: 30000, //超时时间
                cache: false, //不缓存get返回的数据
                beforeSend: function () {

                    //baseOperation.londingToast('数据请求中，请稍后...', 999999);
                },
                success: function (oData, status, requestCode, response, xhr) {
                    //baseOperation.closeToast();
                    if (oData.success !== 1) {
                        return fnSuccess && fnSuccess(oData, status, requestCode, response, xhr);
                    } else {
                        //baseOperation.alertToast('网络繁忙，请稍后再试');
                        var obj = {
                            data : oData,
                        };
                        return fnFail && fnFail(obj);
                    }
                },
                error: function (xhr, erroType, error, msg) {
                    //baseOperation.alertToast('网络连接失败，请检查您的网络', 3333);
                    var obj = {
                        xhr : xhr,
                        erroType : erroType,
                        error : error,
                        msg : msg,
                    };
                    return fnFail && fnFail(obj);
                }
            });
        },

        /**
         * get请求例子 jasRequest.get(sUrl, queryObj, fnSuccess,fnFail);
         */
        // var partURL = "cloudlink-inspection-event/securityCheckRecord/get";
        // var queryObj = {
        //     objectId :　appcan.locStorage.val('recordId')
        // }
        // jasRequest.get(partURL,queryObj,function(oData){
        //     var aData = oData.rows;
        //     var obj = aData[0];
        //     that.render(obj);
        //     appcan.locStorage.val('userFileId', obj.groupId);
        // });
        get: function (sUrl, oData, fnSuccess, fnFail) {
            var that = this;
            try {
                that.ajax.call(that, 'GET', sUrl, oData, fnSuccess, fnFail);
            } catch (tryError) {
                var obj = {
                    tryError : tryError
                };
                return fnFail && fnFail(obj);
            }
        },
        /**
         * post 请求例子 jasRequest.post(sUrl, queryObj, fnSuccess,fnFail);
         */
        // var partURL = "cloudlink-inspection-event/commonData/securityCheckPlan/getPageList";
        // var queryObj = {
        //     "pageNum": that.pageNum,
        //     "pageSize": that.pageSize
        // };
        // jasRequest.post(partURL,queryObj,function(oData){
        //     var aData = oData.rows;
        //     if (aData.length > 0) {
        //         that.render(aData);
        //     }
        //     that.renderItemCount(aData.length, oData.total);
        // });
        post: function (sUrl, oData, fnSuccess, fnFail) {
            var that = this;
            try {
                that.ajax.call(this, 'POST', sUrl, oData, fnSuccess, fnFail);
            } catch (tryError) {
                //alert(e);
                var obj = {
                    tryError : tryError
                };
                return fnFail && fnFail(obj);            }
        },
        uploadFile: function (sUrl, sPath, fnSuccess, fnFail, fnProgress, isHideTip) { //sPath :文件路径,
            //此处有一个坑，多个文件上传成功后，会出现调用error的情况
            appcan.ajax({
                type: 'POST',
                url: completeURL + sUrl + (sUrl.indexOf("?") !== -1 ? '&' : '?') + 'token=' + appcan.locStorage.getVal("token"),
                data: {
                    file: {
                        path: sPath
                    }
                },
                contentType: false, //请求时发送的数据格式
                dataType: 'json', //期望服务器返回的数据格式
                timeout: 30000, //超时时间
                beforeSend: function () {
                    //baseOperation.londingToast('数据请求中，请稍后...', 999999);
                },
                success: function (oData, status, requestCode, response, xhr) {
                    //baseOperation.closeToast();
                    if (oData.success === 1) {
                        return fnSuccess && fnSuccess(oData, status, requestCode, response, xhr);
                    } else {
                        //(!isHideTip) && baseOperation.alertToast('网络繁忙，请稍后再试');
                        var obj = {
                            data : oData,
                        };
                        return fnFail && fnFail(obj);
                    }
                },
                progress: function (progress, xhr) {
                    //baseOperation.londingToast(progress,999999);
                },
                error: function (xhr, erroType, error, msg) {
                    (!isHideTip) && baseOperation.closeToast();
                    //(!isHideTip) && baseOperation.alertToast('网络连接失败，请检查您的网络', 3333);
                    var obj = {
                        xhr : xhr,
                        erroType : erroType,
                        error : error,
                        msg : msg,
                    };
                    return fnFail && fnFail(obj);
                }
            });
        },
        uploadFiles: function (sBizId, oFiles, fnSuccess, fnFail, isHideTip) {
            var that = this;
            var nFileQtty = 0;
            var nFileQtty_success = 0;
            var nFileQtty_fail = 0;
            var fnResult_done = false;

            var fnResult = function () {
                if (nFileQtty_success + nFileQtty_fail < nFileQtty || fnResult_done) {
                    return; //未全部上传成功，返回
                }

                if (nFileQtty_success > 0) {
                    fnResult_done = true;
                    return fnSuccess && fnSuccess(); //有一个附件上传成功，就算成功
                }
                return fnFail && fnFail(); //否则，算作失败
            };

            for (var item in oFiles) { //循环，异步上传附件，是否上传成功，会在回调中计算
                if (oFiles.hasOwnProperty(item)) {
                    var bizType = item;
                    var aFiles = oFiles[item];
                    var sUrl = "cloudlink-core-file/attachment/save?businessId=" + sBizId + "&bizType=" + bizType;
                    aFiles.forEach(function (src, index) {
                        nFileQtty++;
                        that.uploadFile(sUrl, src, function () {
                            nFileQtty_success++;
                            //alert('nFileQtty_success'+nFileQtty_success)
                            fnResult();
                        }, function () { //有时候上传成功后也会走失败，这是坑，加了fnResult_done做判断，已解决
                            //alert('nFileQtty_fail'+nFileQtty_fail)
                            nFileQtty_fail++;
                            fnResult();
                        }, true);
                    });
                }
            }
            if (nFileQtty === 0) { //如果没有附件，直接运行成功回调
                return fnSuccess && fnSuccess();
            }
        },
        deleteFilesByBizId: function (sBizId, fnSuccess) {
            var partURL = "cloudlink-core-file/attachment/delBizAndFileByBizIdsAndBizAttrs";
            var queryObj = {
                "bizTypes": ["pic", "signature"],
                "bizIds": [sBizId]
            };
            jasRequest.post(partURL, queryObj, function (oData) {
                return fnSuccess && fnSuccess();
            });
        }
    };
    window._base = _base;
})(window, $ );