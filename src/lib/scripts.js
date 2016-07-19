$(document).ready(function() {

    // $(".alert").addClass("in").fadeOut(4500);

    /* swap open/close side menu icons */
    $('[data-toggle=collapse]').click(function() {
        // toggle icon
        $(this).find("i:last-child").toggleClass("glyphicon-chevron-right glyphicon-chevron-down");
    });


    // $('[data-page]').mousedown(function() {
    //     var page_id = $(this).attr('data-page');
    //     $('.page').hide();
    //     $(page_id).show();
    //     $(window).scrollTop(0);
    // });

    $('[data-deabledto]').change(function() {

        var $target = $('[data-deabledby=' + $(this).attr('data-deabledto') + ']');


        if ($(this).prop('checked') == true) {
            $target.attr('disabled', false).val('');
        } else {
            $target.attr('disabled', 'disabled').val('123456');
        }

    });
});

$('.form_date').datetimepicker({
        language:  'zh-CN',
        weekStart: 1,
        todayBtn:  1,
        autoclose: 1,
        todayHighlight: 1,
        startView: 2,
        minView: 2,
        forceParse: 0
    });

angular.module('app', ['n3-line-chart'])
.controller('MyChartCtrl', function($scope) {
    $scope.data = {
        dataset0: [
            { x: 0, val_0: 0, val_1: 0, val_2: 0, val_3: 0 },
            { x: 1, val_0: 0.993, val_1: 3.894, val_2: 8.47, val_3: 14.347 },
            { x: 2, val_0: 1.947, val_1: 7.174, val_2: 13.981, val_3: 19.991 },
            { x: 3, val_0: 2.823, val_1: 9.32, val_2: 14.608, val_3: 13.509 },
            { x: 4, val_0: 3.587, val_1: 9.996, val_2: 10.132, val_3: 1.167 },
            { x: 5, val_0: 4.207, val_1: 9.093, val_2: 2.117, val_3: 15.136 },
            { x: 6, val_0: 4.66, val_1: 6.755, val_2: 6.638, val_3: 19.923 },
            { x: 7, val_0: 4.927, val_1: 3.35, val_2: 13.074, val_3: 12.625 }
        ]
    };

    $scope.options = {
    	margin: {top: 20},
        series: [{
                axis: "y",
                dataset: "dataset0",
                key: "val_0",
                label: "检票额",
                interpolation: { mode: "cardinal", tension: 0.7 },
                color: "#337ab7",
                type: ['line', 'dot'],
                id: 'mySeries0'
            }, {
                axis: "y",
                dataset: "dataset0",
                key: "val_1",
                label: "检票数",
                interpolation: { mode: "cardinal", tension: 0.7 },
                color: "rgb(55,120,84)",
                type: ['line', 'dot'],
                id: 'mySeries1'
            }, {
                axis: "y",
                dataset: "dataset0",
                key: "val_2",
                label: "退单",
                interpolation: { mode: "cardinal", tension: 0.7 },
                color: "rgb(205,20,4)",
                type: ['line', 'dot'],
                id: 'mySeries2'
            }, {
                axis: "y",
                dataset: "dataset0",
                key: "val_3",
                label: "订单",
                interpolation: { mode: "cardinal", tension: 0.7 },
                color: "rgb(235,150,4)",
                type: ['line', 'dot'],
                id: 'mySeries3'
            }


        ],
        axes: { x: { key: "x"} }
    };
});
