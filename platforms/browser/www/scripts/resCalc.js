$(function() {
    var _objectiveSeg = new NikRadioGroup('objectiveSeg')
        , _mediaSeg = new NikRadioGroup('mediaSeg')
        , _naSldr = new NikSlider('naSldr', { dynamicPercentage: true })
        , _fovSldr = new NikSlider('fovSldr', { dynamicPercentage: true })
        , _binningSeg = new NikRadioGroup('binningSeg')
        , _relaySldr = new NikSlider('relaySldr', { dynamicPercentage: true })
        , _illumSeg = new NikRadioGroup('illumSeg')
        , _moreInfoTogBtn = new NikButton('moreInfoTog', true)
        , _formulaTogBtn = new NikButton('formulaTog')
        
        , _moreInfo = false
        , _specCtx = document.getElementById('specCan').getContext('2d')
        , _CAN_WIDTH = _specCtx.canvas.width
        , _CAN_HEIGHT = _specCtx.canvas.height
        , _calcCtx = document.createElement('canvas').getContext('2d')
        , _fovArea //in pixels
        , _overlap //in pixels
        , _$popup = $('#popup')

        //CONTROLS
        , _$relayText = $('input[name=relayText]')
        , _$naText = $('input[name=naText]')
        , _$naConText = $('input[name=naConText]')
        , _$cameraDropDown = $('select[name=camera]')
        , _camLbl = document.getElementById('camLbl')
        , _$activeYPix = $('input[name=activeY]')
        , _$pointScanPinhole = $('input[name=pointScanPinholeInput]')

        //DIASCOPIC
        , _conMediaSeg = new NikRadioGroup('conMediaSeg')
        , _conSldr = new NikSlider('conSldr', { dynamicPercentage: true })

        //EPISCOPIC
        , _modalitySeg = new NikRadioGroup('modalitySeg')

        //spinning disk
        , _modelSeg = new NikRadioGroup('modelSeg')
        , _w1DiskSeg = new NikRadioGroup('w1DiskSeg')
        , _xLightPinholeSeg = new NikRadioGroup('xLightPinholeSeg')

        //point-Scanning Controls
        , _pointScanModelSeg = new NikRadioGroup('pointScanModelSeg')
        , _activeXPixSeg = new NikRadioGroup('activePixSeg')
        , _pointScanPinholeSeg = new NikRadioGroup('pointScanPinSeg')

        //VISIBILITY OPTIONS
        , _$binning = $('#binning')
        , _$cameraSel = $('#cameraSel')
        , _$diascopic = $('#diascopic')
        , _$episcopic = $('#episcopic')

        //spinning Disk
        , _$spinningDisk = $('#spinningDiskCon')
        , _$xLightPinhole = $('#xLightPinhole')
        , _$w1Disk = $('#w1Disk')

        //point-scan
        , _$pointScanCon = $('#pointScanConCon')
        , _$yPixInput = $('#psInputCon')
        , _$yPixSeg = $('#pointScanPinSeg')

        //Display options
        , _$confocalDisp = $('#confocalDisp')
        , _$bpPixSizeCon = $('#bpPixSizeCon')
        , _$samplImaged = $('#samplImaged')

        //Camera Parameters
        , _camParamLbl = document.getElementById('camParamLbl')
        , _camera = document.getElementById('camera')
        , _activePixVal = document.getElementById('activePixVal')
        , _pixSizeVal = document.getElementById('pixSizeVal')
        , _pixSizeLbl = document.getElementById('pixSizeLbl')
        , _bpPixSizeLbl = document.getElementById('bpPixSizeLbl')
        , _bpPixSizeVal = document.getElementById('bpPixSizeVal')
        , _sensorDimLbl = document.getElementById('sensorDimLbl')
        , _sensorDimVal = document.getElementById('sensorDimVal')
        , _samplUsed = document.getElementById('samplUsed')

        //Microscope parameters
        , _objective = document.getElementById('objective')
        , _totalMag = document.getElementById('totalMag')
        , _fieldOfView = document.getElementById('fieldOfView')
        , _latRes = document.getElementById('latRes')
        , _axialRes = document.getElementById('axialRes')
        , _sampleRate = document.getElementById('sampleRate')
        , _brightness = document.getElementById('brightness')

        //Confocal Parameters
        , _pinholeDiameter = document.getElementById('pinholeDiameter')
        , _backprojectedPinholeRadius = document.getElementById('backprojectedPinholeRadius')
        , _pinholeSize = document.getElementById('pinholeSize')
        , _IS_TOUCH = MEUtil.IS_TOUCH_DEVICE
        , _EVENT_CTRLS = _IS_TOUCH
                             ? ['touchstart', 'touchmove', 'touchend', 'touchleave']
                             : ['mousedown', 'mousemove', 'mouseup', 'mouseleave']
        , _MAX_INT = Number.MAX_SAFE_INTEGER
        , _EQUATION_CONSTANTS = {
              "abbeLatRes": 0.61
          }
        , _curSt = {
              "binning": 1
              , "camera": 'DS-Fi1c'
              , "camRelay": 0.5
              , "chipH": 6.5
              , "chipHPixels": 1920
              , "chipW": 8.7
              , "chipWPixels": 2560
              , "naCon": 0.65
              , "fov": 20
              , "emission": 509
              , "excitation": 488
              , "illumination": 'Episcopic'
              , "media": 1.0003
              , "mediaCon": 1
              , "modality": 'Widefield'
              , "model": 'CSU-X1'
              , "NA": 0.53
              , "objective": 4
              , "pinhole": 30
              , "pixelSize": 3.0
              , "w1Disk": 25
          }
        , _specData = []
        , _cameraInfo = []
        , _popupData = {
              width: null
              , height: null
              , popups: {}
          }
        , _windowW = $(window).width()
        , _calc = {};

    updateVisibility();
    loadData();

    function loadData() {
        $.when(
                $.get('data/camData.txt'
                    , function loadFromTxt( txt ) {
                        var newLine = /\r?\n|\r/g;
                        var perLine = txt.split(newLine);
                        var line, i, x;
                        for (i = 0, x = perLine.length; i < x; i++) {
                            line = perLine[i].split(', ');
                            _cameraInfo[line[0]] = {
                                "pixelSize": parseFloat(line[1])
                                , "chipW": parseFloat(line[2])
                                , "chipH": parseFloat(line[3])
                                , "chipWPixels": parseInt(line[4])
                                , "chipHPixels": parseInt(line[5])
                                , "type": line[6]
                                , "color": line[7] !== 'Color' ? false : true
                            };
                        }
                    })
                , $.ajax({
                    type: 'GET'
                    , url: 'data/popupData.xml'
                    , success: function loadSuccessXml( d ) {
                        var $data = $(d);
                        _popupData.width = $data.find('popups width').text();
                        _popupData.height = $data.find('popups height').text();
                        $data.find('popup')
                            .each(function loadFromXml() {
                                var $this = $(this);
                                var temp = new Popup();
                                temp.popupFromXml($this);
                                _popupData.popups[temp.title] = temp;
                            });
                    }
                })
            )
            .done(initialize);
    }

    function initialize() {
        buildImageData(function() {
            setupDropDown();
            initControls();
            updateVisibility();

            addListeners();
            _specCtx.globalCompositeOperation = 'lighter';
            _conSldr.setPosition(0.5);
            _naSldr.setPosition(0.5);
            _fovSldr.setPosition(0.5);
            _relaySldr.setPosition(0.5);

            _calcCtx.canvas.width = _CAN_WIDTH;
            _calcCtx.canvas.height = _CAN_HEIGHT;
        });

        MEUtil.raf(enterFrameHandler);
    }

    function buildImageData( callback ) {
        var img = new Image();
        img.onload = function() {
            _specData[0] = getPixels(img);
            callback();
        };
        img.src = 'images/spec.jpg';
    }

    function setupDropDown() {
        var item;
        for (item in _cameraInfo)
            if (_cameraInfo.hasOwnProperty(item)) $('select[name=camera]').append($('<option />').text(item));
    }

    function initControls() {
        _objectiveSeg.setSelectedIndex(0);
        _objectiveSeg.setCustomProperty('objective', [4, 10, 20, 40, 60, 100, 'custom']);

        _mediaSeg.setSelectedIndex(0);
        _mediaSeg.setCustomProperty('media', [1, 1.33, 1.47, 1.52]);

        _binningSeg.setSelectedIndex(0);
        _binningSeg.setCustomProperty('binning', [1, 2, 4]);

        _relaySldr.setPosition(0.5);

        _illumSeg.setSelectedIndex(0);
        _illumSeg.setCustomProperty('illumination', ['Episcopic', 'Diascopic']);

        _conMediaSeg.setSelectedIndex(0);
        _conMediaSeg.setCustomProperty('media', [1, 1.52]);

        _modalitySeg.setSelectedIndex(0);
        _modalitySeg.setCustomProperty('modality', ['Widefield', 'Spinning Disk Confocal', 'Point-Scanning Confocal']);

        _modelSeg.setSelectedIndex(0);
        _modelSeg.setCustomProperty('model', ['CSU-X1', 'CSU-W1', 'X-Light']);

        _pointScanModelSeg.setSelectedIndex(0);
        _pointScanModelSeg.setCustomProperty('model', ['Nikon A1', 'Nikon C2']);

        _activeXPixSeg.setSelectedIndex(3);
        _activeXPixSeg.setCustomProperty('pixel', [64, 128, 256, 512, 1024, 2048, 4096]);

        _xLightPinholeSeg.setSelectedIndex(0);
        _xLightPinholeSeg.setCustomProperty('pinhole', [30, 40, 50, 70]);

        _w1DiskSeg.setSelectedIndex(0);
        _w1DiskSeg.setCustomProperty('pinhole', [25, 50]);

        _pointScanPinholeSeg.setSelectedIndex(0);
        _pointScanPinholeSeg.setCustomProperty('pinhole', [20, 30, 40, 60, 90, 150]);
    }

    function getMousePos(elem, e) {
        var rect = elem.getBoundingClientRect()
            , xClick = _IS_TOUCH ? e.changedTouches[0].clientX : e.clientX
            , yClick = _IS_TOUCH ? e.changedTouches[0].clientY : e.clientY;
        var x = xClick - rect.left;
        var y = yClick - rect.top;

        return new Point(x, y);
    }

    function buildAndDispPopup( target, x, y ) {
        var data = _popupData.popups[target];
        var w = parseInt(_popupData.width);
        var offset = 110;
        if (x + w > _windowW) x = _windowW - w - offset;

        _$popup.show(250).finish();
        _$popup.css({
                top: y
                , left: x
                , width: w
            })
            .find('h2')
            .html(data.title)
            .end()
            .find('.content')
            .html(data.content)
            .end()
            .find('#link')
            .attr('href', data.link)
            .end();
    }

    function addListeners() {
        var $fovText = $('input[name=fovText]')
            , $objective = $('input[name=objective]')
            , $excitation = $('input[name=Ex]')
            , $emission = $('input[name=Em]')
            , $customMag = $('input[name=objective]')
            , $popup = $('.popTarget');

        $(window)
            .resize(function windowResizeHandler() {
                _windowW = $(window).width();
                _$popup.hide();
            });

        //POPUP
        //TODO: add touch device capability.
        _moreInfoTogBtn.ontouch = function togBtnHandler() {
            _moreInfo = !_moreInfo;
            _$popup.hide();
        };
        var delay = 500, setTimeoutConst;
        $popup.hover(function (e) {
            if (_moreInfo) $(e.currentTarget.parentNode).addClass('hover');
            
            setTimeoutConst = setTimeout(function () {
                    if (_moreInfo) {
                        var container = document.body;
                        var p = getMousePos(container, e);
                        var target = e.currentTarget.innerText.split(':')[0];
                        buildAndDispPopup(target, p.x, p.y);
                    }
                }, delay);
        }, function (e) {
            if (_moreInfo) {
                $(e.currentTarget.parentNode).removeClass('hover');
            }

                clearTimeout(setTimeoutConst);
            });
        $('.close').on('click', function hidePopup() { _$popup.hide(250).finish(); });

        //--------CONTROLS
        _objectiveSeg.onchange = function objSegHandler() {
            if (this.getSelectedButton().objective !== 'custom') {
                $customMag.blur();
                _curSt.objective = this.getSelectedButton().objective;
            } else $customMag.focus();
            calculate();
        };
        $objective.keyup(function objInputHandler() {
            _curSt.objective = $objective.val();
            calculate();
        });
        _mediaSeg.onchange = function mediaSegHandler() {
            var pos = _naSldr.getPosition();
            _curSt.media = this.getSelectedButton().media;

            if (!pos) _$naText.val(0.05);
            else {
                _curSt.NA = pos * _curSt.media;
                _$naText.val(_curSt.NA.toFixed(2));
            }
            calculate();
        };

        _$naText.on('input'
            , function naInputHandler() {
                var val = _$naText.val();
                if (sanitizeInput(val)) handleSldrInput('NA', val, _naSldr, true, _$naText);
            });
        $('#naSldr').dblclick(function naSldrDblClkHandler() { handleSldrInput('NA', 1, _naSldr, true, _$naText); });
        _naSldr.onchange = function naSldrHandler() { handleSldrInput('NA', undefined, _naSldr, false, _$naText); };

        $fovText.on('input'
            , function fovInputHandler() {
                _curSt.fov = $fovText.val();
                _fovSldr.setCustomPosition(10, 30, _curSt.fov);
                handleCanvas();
                calculate();
            });
        _fovSldr.onchange = function fovSldrHandler() {
            _curSt.fov = this.getPosition(10, 30) | 0;
            $fovText.val(_curSt.fov);
            handleCanvas();
            calculate();
        };
        $excitation.keyup(function exInputHandler() {
            _curSt.excitation = $excitation.val();
            calculate();
        });
        $emission.keyup(function emInputHandler() {
            _curSt.emission = $emission.val();
            calculate();
        });

        //CAMERA
        _$cameraDropDown.on('change'
            , function cameraDropDwnHandler() {
                setCamera();
                handleCanvas();
                calculate();
            });
        _binningSeg.onchange = function binningSegHandler() {
            _curSt.binning = this.getSelectedButton().binning;
            calculate();
        };
        _$relayText.on('input'
            , function relayInputHandler() {
                var val = _$relayText.val();
                if (sanitizeInput(val)) handleSldrInput('camRelay', val, _relaySldr, true, _$relayText);
            });
        $('#relaySldr')
            .dblclick(function relaySldrDblClkHandler() {
                handleSldrInput('camRelay', 1, _relaySldr, true, _$relayText);
            });
        _relaySldr.onchange = function relaySldrHandler() {
            handleSldrInput('camRelay', undefined, _relaySldr, false, _$relayText);
        };

        //EPI OR DIA
        _illumSeg.onchange = function illumSegHandler() {
            _curSt.illumination = this.getSelectedButton().illumination;
            setModality();
            setCamera();
            updateVisibility();
            calculate();
            handleCanvas();
        };

        //DIASCOPIC
        _conMediaSeg.onchange = function conMediaSegHandler() {
            var pos = _conSldr.getPosition();
            _curSt.mediaCon = parseFloat(this.getSelectedButton().media);
            if (!pos) _$naConText.val(0.05);
            else {
                _curSt.naCon = pos * _curSt.mediaCon;
                _$naConText.val(_curSt.naCon.toFixed(2));
            }
            calculate();
        };
        _$naConText.change = function conNaInputHandler() {
            var val = _$naConText.val();
            if (sanitizeInput(val)) handleSldrInput('mediaCon', val, _conSldr, true, _$naConText);
        };
        $('#conSldr')
            .dblclick(function conSldrDblClkHandler() { handleSldrInput('mediaCon', 1, _conSldr, true, _$naConText); });
        _conSldr
            .onchange = function conSldrHandler() {
                handleSldrInput('naCon', undefined, _conSldr, false, _$naConText);
            };

        //EPISCOPIC
        _modalitySeg.onchange = function modalitySegHandler() {
            setModality();
            setModel();
            setPinhole();
            setCamera();
            handleSldrInput('camRelay', 1, _relaySldr, false, _$relayText);
            if (_curSt.modality === 'Point-Scanning Confocal') _relaySldr.setPosition(0);
            updateVisibility();
            calculate();
            handleCanvas();
        };
        _modelSeg.onchange = function modelSegHandler() {
            setModel();
            setPinhole();
            updateVisibility();
            calculate();
            handleCanvas();
        };
        _xLightPinholeSeg.onchange = function xLightSegHandler() {
            setPinhole();
            updateVisibility();
            calculate();
        };
        _w1DiskSeg.onchange = function w1SegHandler() {
            setPinhole();
            calculate();
        };

        //POINT SCANNING
        _pointScanModelSeg.onchange = function pointScanSegHandler() {
            setCamera();
            setModel();
            this.getSelectedIndex()
                ? _activeXPixSeg.setIndexesEnabled([6], false, 5)
                : _activeXPixSeg.setIndexesEnabled([6], true, 5);
            setPinhole();
            updateVisibility();
            calculate();
        };
        _activeXPixSeg.onchange = function xPixSegHandler() {
            _curSt.chipWPixels = this.getSelectedButton().pixel;
            _curSt.pixelSize = 12.75 / _curSt.chipWPixels;

            var textVal = parseInt(_$activeYPix.val());

            if (textVal > _curSt.chipWPixels) _$activeYPix.val(_curSt.chipWPixels);

            calculate();
        };
        _$activeYPix.keyup(function yPixKeyupHandler() {
            var val = this.value;
            if (val < 1) _curSt.chipHPixels = 1;
            else if (val > _curSt.chipWPixels) _curSt.chipHPixels = _curSt.chipWPixels;
            else _curSt.chipHPixels = val;
            this.value = _curSt.chipHPixels;
            calculate();
        });
        _$pointScanPinhole.on('input'
            , function pointScanInputHandler() {
                setPinhole();
                calculate();
            });
        _pointScanPinholeSeg.onchange = function pointScanPinholeSegHandler() {
            setPinhole();
            calculate();
        };
    }

    //returns true if val is a number
    function sanitizeInput( val ) { return !isNaN(val.substring(0, 4).slice(-1)); }

    function setModel() {
        if (_curSt.modality === 'Point-Scanning Confocal') _curSt.model = _pointScanModelSeg.getSelectedButton().model;
        else _curSt.model = _modelSeg.getSelectedButton().model;
    }

    function setModality() {
        var modality = ''; //placeholder for diascopic
        var cfW = 0, cfH = 0;
        if (_curSt.illumination === 'Episcopic')
            switch (_modalitySeg.getSelectedButton().modality) {
                case 'Widefield':
                    modality = 'Widefield';
                    cfW = 28;
                    cfH = 28;
                    break;
                case 'Spinning Disk Confocal':
                    modality = 'Spinning Disk Confocal';
                    switch (_curSt.model) {
                        case 'CSU-X1':
                            cfW = 10;
                            cfH = 7;
                            break;
                        case 'CSU-W1':
                            cfW = 17;
                            cfH = 16;
                            break;
                        case 'X-Light':
                            cfW = 12;
                            cfH = 12;
                            break;
                    }
                    break;
                case 'Point-Scanning Confocal':
                    modality = 'Point-Scanning Confocal';
                    cfW = 12.75;
                    cfH = 12.75;
                    break;
            }
        _curSt.modality = modality;
        _curSt.cfApertureW = cfW;
        _curSt.cfApertureH = cfH;
    }

    function handleSldrInput( propToChange, val, sldr, setSldr, input ) {
        var min = 0, max = 1;
        switch (sldr) {
            case _naSldr:
                min = 0.05;
                max = _curSt.media;
                break;
            case _conSldr:
                min = 0.05;
                max = _curSt.mediaCon;
                break;
            case _relaySldr:
                if (_curSt.modality !== 'Point-Scanning Confocal') {
                    min = 0.5;
                    max = 2.5;
                } else {
                    min = 1;
                    max = 1000;
                }
                break;
            case _fovSldr:
                min = 10;
                max = 30;
                break;
        }
        if (val === undefined) val = sldr.getPosition(min, max).toFixed(2);
        if (isNaN(val)) val = min;

        if (val < min) val = min;
        else if (val > max) val = max;

        if (setSldr) sldr.setCustomPosition(min, max, val);
        input.val(val);
        _curSt[propToChange] = parseFloat(val);
        calculate();
    }

    function setPinhole() {
        var val = 0;
        switch (_curSt.model) {
            case 'CSU-X1':
                val = 50;
                break;
            case 'CSU-W1':
                val = _w1DiskSeg.getSelectedButton().pinhole;
                break;
            case 'X-Light':
                val = _xLightPinholeSeg.getSelectedButton().pinhole;
                break;
            case 'Nikon A1':
                val = _$pointScanPinhole.val();
                break;
            case 'Nikon C2':
                val = _pointScanPinholeSeg.getSelectedButton().pinhole;
                break;
        }
        _curSt.pinhole = val;
    }

    function setCamera() {
        if (_curSt.modality === 'Point-Scanning Confocal') {
            _curSt.camera = _pointScanModelSeg.getSelectedButton().model;
            _curSt.model = _pointScanModelSeg.getSelectedButton().model;
            _curSt.pixelSize = 12.75 / _activeXPixSeg.getSelectedButton().pixel;
            _curSt.chipWPixels = _activeXPixSeg.getSelectedButton().pixel;
            _curSt.chipHPixels = _$activeYPix.val();
            _curSt.chipW = 12.75;
            _curSt.chipH = 12.75;
        } else {
            var camera = _cameraInfo[_$cameraDropDown.val()];
            _curSt.camera = _$cameraDropDown.val();
            _curSt.pixelSize = camera.pixelSize;
            _curSt.chipHPixels = camera.chipHPixels;
            _curSt.chipWPixels = camera.chipWPixels;
            _curSt.chipW = camera.chipW;
            _curSt.chipH = camera.chipH;
        }
    }

    function updateVisibility() {
        var show = []
            , hide = [];

        var ptScanSettings = [_$bpPixSizeCon, _$cameraSel, _$binning, _$samplImaged];

        if (_illumSeg.getSelectedIndex()) { //diascopic
            show = show.concat(_$diascopic, ptScanSettings);
            hide.push(_$episcopic, _$confocalDisp);
        } else { //episcopic
            show = show.concat(_$episcopic, ptScanSettings);
            hide.push(_$diascopic);
            switch (_curSt.modality) {
                case 'Widefield':
                    hide.push(_$spinningDisk, _$confocalDisp, _$pointScanCon);
                    break;
                case 'Spinning Disk Confocal':
                    show = show.concat([_$spinningDisk, _$confocalDisp], ptScanSettings);
                    hide.push(_$pointScanCon);
                    switch (_curSt.model) {
                        case 'CSU-X1':
                            hide.push(_$w1Disk, _$xLightPinhole);
                            break;
                        case 'CSU-W1':
                            show = show.concat(_$w1Disk, ptScanSettings);
                            hide.push(_$xLightPinhole);
                            break;
                        case 'X-Light':
                            show = show.concat(_$xLightPinhole, ptScanSettings);
                            hide.push(_$w1Disk);
                            break;
                    }
                    break;
                case 'Point-Scanning Confocal':
                    show.push(_$pointScanCon, _$confocalDisp);
                    hide = hide.concat(_$spinningDisk, ptScanSettings);
                    if (_curSt.model === 'Nikon A1') {
                        show.push(_$yPixInput);
                        hide.push(_$yPixSeg);
                    } else if (_curSt.model === 'Nikon C2') {
                        show.push(_$yPixSeg);
                        hide.push(_$yPixInput);
                    }

                    break;
            }
        }
        //sometimes both arrays contain the same value; ordering is remedy
        setVisibility(show, 'show');
        setVisibility(hide, 'hide');
    }

    function setVisibility( object, operation ) {
        for (var i = 0, x = object.length; i < x; i++) object[i][operation]();
    }

    function calculate() {
        var isDiascopic = _illumSeg.getSelectedIndex();
        var modality = _curSt.modality;


        var cfApertureX = _curSt.cfApertureW;
        var cfApertureY = _curSt.cfApertureH;
        var pinholeRad = _curSt.pinhole / 2;
        
        //readability/optimizations
        var objective = _curSt.objective;
        var nObj = _curSt.media;
        var nObjSq = nObj * nObj;
        var nCon = _curSt.mediaCon;
        var naObj = _curSt.NA;
        var naObjSq = naObj * naObj;
        var naCon = _curSt.naCon;
        var relay = _curSt.camRelay;
        var pixSize = _curSt.pixelSize; //μm
        var binning = _curSt.binning;
        var lambda = _curSt.excitation; //nm 
        var lambdaDia = 546; //nm
        var lambdaEm = _curSt.emission; //nm
        var latRes, brightness, axialRes, sampRate, opticalThickness = 0;

        //calculations
        var totalMag = objective * relay;
        var bpPixSize = pixSize * binning / totalMag; //μm
        var bpPinRad = pinholeRad / objective; //μm

        var cfApertureArea = modality === 'Widefield' || modality === ''
                                 ? _MAX_INT
                                 : cfApertureX * cfApertureY; //mm

        if (isDiascopic) {
            latRes = 1.22 * lambdaDia / (naObj + naCon); //nm
            brightness = 10000 * (naObjSq / (objective * objective));
        } else {
            latRes = _EQUATION_CONSTANTS.abbeLatRes * _curSt.excitation / naObj; //nm
            brightness = 10000 * naObjSq * naObjSq / Math.pow(objective, 2);
        }
        var airyUnit = bpPinRad / (latRes / 1000);

        var c = 0.32 * airyUnit + 0.43;

        if (isDiascopic) axialRes = 2 * lambdaDia * ((nObj + nCon) / 2) / Math.pow((naObj + naCon) / 2, 2);
        else if (airyUnit > 0.25 && airyUnit < 1.7 && modality !== 'Widefield'
        ) axialRes = c * 2 * nObj * lambda / naObjSq;
        else if (airyUnit > 1.7 || modality === 'Widefield') axialRes = 2 * lambda * nObj / naObjSq;
        else if (airyUnit < 0.25) axialRes = 'INVALID';

        sampRate = latRes / (1000 * bpPixSize);
        if (modality === 'Point-Scanning Confocal') {
            opticalThickness = Math.sqrt(
                Math.pow(0.88 * lambdaEm / (nObj - Math.sqrt(nObjSq - naObjSq)), 2)
                + Math.pow(Math.SQRT2 * nObj * (bpPinRad * 1000) * 2 / naObj, 2)
            );

            var virtualPix = 1000 * cfApertureX / _curSt.chipWPixels; //μm
            var bpVpixSize = 1000 * virtualPix / totalMag; //nm
            sampRate = latRes / bpVpixSize;
            c = 0.2 * airyUnit + 0.39;
            latRes = c * lambda / naObj;
        }

        var samplUsed = (_overlap / _fovArea) * 100;

        _calc = {
            "airyUnit": airyUnit
            , "apertureHeight": cfApertureY
            , "apertureWidth": cfApertureX
            , "axialRes": axialRes
            , "bpPixSize": bpPixSize
            , "bpPinRad": bpPinRad
            , "brightness": brightness
            , "latRes": latRes
            , "opticalThickness": opticalThickness
            , "pinholeRadius": pinholeRad
            , "samplRate": sampRate
            , "samplUsed": samplUsed
            , "totalMag": totalMag
            , "virtualPix": virtualPix
        };

        updateDisplay();
    }

    function updateDisplay() {
        var dimText, pixLbl, pixVal, camParamLbl, camLbl;
        if (_curSt.modality !== 'Point-Scanning Confocal') {
            camLbl = 'Camera: ' + _curSt.camera;
            camParamLbl = 'Camera Parameters';
            pixLbl = 'Real Pixel Size: ';
            pixVal = _curSt.pixelSize.toFixed(2)
                + ' x '
                + _curSt.pixelSize.toFixed(2)
                + ' µm';
            dimText = 'Sensor Dimensions: ';
            _camLbl.innerHTML = 'Camera Relay:';
        } else {
            camLbl = 'Camera: ' + _curSt.camera + ' Confocal';
            camParamLbl = 'Scanning Parameters';
            pixLbl = 'Virtual Pixel Size: ';
            pixVal = _calc.virtualPix.toFixed(2)
                + ' x '
                + _calc.virtualPix.toFixed(2)
                + ' µm';
            dimText = 'Confocal Aperture Dimensions: ';
            _camLbl.innerHTML = 'Zoom:';
        }

        //Camera/Scanning Parameters
        _camParamLbl.innerHTML = camParamLbl;
        _camera.innerHTML = camLbl;
        _activePixVal.innerHTML = _curSt.chipWPixels + ' x ' + _curSt.chipHPixels;
        _pixSizeLbl.innerHTML = pixLbl;
        _pixSizeVal.innerHTML = pixVal;
        _bpPixSizeLbl.innerHTML = 'Backprojected Pixel Size: ';
        _bpPixSizeVal.innerHTML = _calc.bpPixSize.toFixed(2) + ' µm';
        _sensorDimLbl.innerHTML = dimText;
        _sensorDimVal.innerHTML = _curSt.chipW + ' x ' + _curSt.chipH + ' mm';
        _samplUsed.innerHTML = ' ' + _calc.samplUsed.toFixed(2) + '%';

        //Microscope Parameters
        _objective.innerHTML = _curSt.objective + 'X / ' + _curSt.NA + ' NA';
        _totalMag.innerHTML = _curSt.objective + ' x ' + _curSt.camRelay + ' = ' + _calc.totalMag.toFixed(2) + ' X';
        _fieldOfView.innerHTML = _curSt.fov;

        typeof _calc.axialRes === 'string'
            ? _axialRes.innerHTML = _calc.axialRes
            : _axialRes.innerHTML = _calc.axialRes.toFixed(2) + ' nm';

        typeof _calc.latRes === 'string'
            ? _latRes.innerHTML = _calc.latRes
            : _latRes.innerHTML = _calc.latRes.toFixed(2) + ' nm';

        _calc.samplRate < 2.3 || _calc.samplRate > 4.3
                ? $('#sampleRate').css('color', '#F00')
                : $('#sampleRate').css('color', '#0F0')
            , _sampleRate.innerHTML = _calc.samplRate.toFixed(2);
        _brightness.innerHTML = _calc.brightness.toFixed(2);

        //Confocal Parameters
        if (_curSt.modality === 'Point-Scanning Confocal' || _curSt.modality === 'Spinning Disk Confocal') {
            _pinholeDiameter.innerHTML = _calc.pinholeRadius * 2 + 'µm';
            _backprojectedPinholeRadius.innerHTML = (_calc.bpPinRad).toFixed(3) + 'µm';
            _pinholeSize.innerHTML = _calc.airyUnit.toFixed(3) + 'AU';
        }
    }

    function handleCanvas() {
        var scaleFactor = 7
            , isEpiscopic = !_illumSeg.getSelectedIndex()
            , fov = _curSt.fov * scaleFactor / 2
            , halfChipH = _curSt.chipH * scaleFactor / 2
            , halfChipW = _curSt.chipW * scaleFactor / 2
            , centerX = _CAN_WIDTH / 2
            , centerY = _CAN_HEIGHT / 2
            , targetColor = [255, 255, 0]
            , ctx = _specCtx
            , radGrad = ctx.createRadialGradient(
                  centerX
                  , centerY
                  , isEpiscopic
                    ? fov - 10
                    : fov
                  , centerX
                  , centerY
                  , isEpiscopic
                    ? fov + 30
                    : fov + 50
              );
        radGrad.addColorStop(0, 'transparent');
        radGrad.addColorStop(1, '#000');

        ctx.clearRect(0, 0, _CAN_WIDTH, _CAN_HEIGHT);
        //    ctx.putImageData(_specData[0], 0, 0);

        //FOV
        drawFov(ctx, centerX, centerY, fov, 'fill', '#0F0');
        _fovArea = countColoredPixels(ctx.getImageData(0, 0, _CAN_WIDTH, _CAN_HEIGHT), [0, 255, 0]);

        //CHIP
        drawSquare(ctx, centerX, centerY, halfChipW, halfChipH, 'fill', '#F00');

        //APERTURE
        if (_curSt.modality !== 'Widefield' && isEpiscopic) {
            var halfConX = _curSt.cfApertureW * scaleFactor / 2
                , halfConY = _curSt.cfApertureH * scaleFactor / 2;
            targetColor = [255, 255, 255];
            drawSquare(ctx, centerX, centerY, halfConX, halfConY, 'fill', '#00F');
        }

        //GRADIENT
        ctx.fillStyle = radGrad;
        ctx.fillRect(0, 0, _CAN_WIDTH, _CAN_HEIGHT);

        //LEGEND
        drawLegend();

        _overlap = countColoredPixels(ctx.getImageData(0, 0, _CAN_WIDTH, _CAN_HEIGHT), targetColor);
    }

    function drawFov( ctx, centerX, centerY, rad, style, color ) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, rad, 0, 2 * Math.PI);
        ctx.closePath();
        ctx[style + 'Style'] = color;
        ctx[style]();
    }

    function drawSquare( ctx, centerX, centerY, halfW, halfH, style, color ) {
        ctx.beginPath();
        ctx.moveTo(centerX - halfW, centerY - halfH);
        ctx.lineTo(centerX - halfW, centerY + halfH);
        ctx.lineTo(centerX + halfW, centerY + halfH);
        ctx.lineTo(centerX + halfW, centerY - halfH);
        ctx.closePath();
        ctx[style + 'Style'] = color;
        ctx[style]();
    }

    function countColoredPixels( img, targetColor ) {
        var area = 0;
        for (var i = 0, data = img.data, x = data.length; i < x; i += 4)
            if (data[i] === targetColor[0]
                && data[i + 1] === targetColor[1]
                && data[i + 2] === targetColor[2]
                && data[i + 3] === 255) area++;
        return area;
    }

    function drawLegend() {
        var area;
        var ctx = _specCtx;

        ctx.font = '13px Helvetica';
        ctx.fillStyle = '#0F0';
        ctx.fillText('Field of View', 5, 12);
        ctx.fillStyle = '#F00';

        if (_curSt.modality !== 'Point-Scanning Confocal') area = 'Camera Chip';
        else area = 'Scan Area';

        ctx.fillText(area, 5, 25);
        ctx.fillStyle = '#00F';
        ctx.fillText('Confocal Aperture', 5, 38);
    }

    function getPixels( img ) {
        var c = getCanvas(img.width, img.height);
        var ctx = c.getContext('2d');
        ctx.drawImage(img, 0, 0);
        return ctx.getImageData(0, 0, c.width, c.height);
    }

    function getCanvas( w, h ) {
        var c = document.createElement('canvas');
        c.width = w;
        c.height = h;
        return c;
    }

    function enterFrameHandler() { MEUtil.raf(enterFrameHandler); }

    //prototyping / helper functions
    NikSlider.prototype.setCustomPosition = function( min, max, pos ) { this.setPosition((pos - min) / (max - min)); };
    NikRadioGroup.prototype.setIndexesEnabled = function( indexes, state, defaultIndex ) {
        var button;
        var selectedIndex = this.getSelectedIndex();
        for (var i = 0; i < indexes.length; i++) {
            button = this.getButtonAtIndex(indexes[i]);
            if (!state) {
                if (selectedIndex === indexes[i]) this.setSelectedIndex(defaultIndex);
                button.style.pointerEvents = 'none';
                button.style.opacity = 0.5;
            } else {
                button.style.pointerEvents = 'all';
                button.style.opacity = 1;
            }
        }
    };

    function Point( x, y ) {
        this.x = x;
        this.y = y;
    }
});

function Popup( title, content, link ) {
    this.title = title || '';
    this.content = content || '';
    this.link = link || '';
    return this;
}

Popup.prototype = {
    popupFromXml: function ($popup) {
        this.title = $popup.find('title').text();
        this.content = $popup.find('content').text();
        this.link = $popup.find('link').text();
        return this;
    }
};