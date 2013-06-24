var AcmeCoffeeModule = (function() {
    
    var geocoder;
    var map;
    var markersArray = [];
    var infowindow;
    var contentString = '<div id="graph_container" style="min-width: 500px; height: 300px; margin: 0 auto"></div>';
    var salesData;
    
    var initializeMap = function() {
        $("#loading-image").hide();
        $("#map-canvas").show(); 
        
        geocoder = new google.maps.Geocoder();
        var mapOptions = {
            center: new google.maps.LatLng(49.2505, -123.1119),
            zoom: 12,
            mapTypeId: google.maps.MapTypeId.ROADMAP
        };
        map = new google.maps.Map(document.getElementById("map-canvas"), mapOptions); 
        
        infowindow = new google.maps.InfoWindow({ content: contentString });
        google.maps.event.addListener(infowindow, 'domready', function() {
            addGraph(infowindow);                   
        });
        
        initializeMarkers();
    };
    
    var initializeUI = function() {
        $( "#datepicker" ).datepicker({
            showButtonPanel: false,
            dateFormat: "DD MM d, yy"
        });
        
        $('#timepicker').timepicker({
            showButtonPanel: false,
	        showMinute: false,
	        hourMin: 7,
	        hourMax: 20
        });
        
        $("#search").click(function(event) {
                event.preventDefault();
                handleSearch();
        });
    };
    
    var addGraph = function(infowindow) {
        var marker = infowindow.get("marker");
        
        var subTitle = "";
        var sales = [];
        if (marker) {
            var address = marker.get("address");
            var date = marker.get("date");
            var times = marker.get("times");
            
            subTitle = address + " - " + date;
            
            if (times) {
                $.each(times, function(index, item) { 
                    var locations = item["locations"];
                    $.each(locations, function(index, item) { 
                        if (item["address"] === address) {
                            sales.push(parseInt(item["amt"]));    
                        }    
                    });
                });
            }    
        }
        
        $('#graph_container').highcharts({
            chart: {
                type: 'bar'
            },
            title: {
                text: 'Acme Coffee Sales'
            },
            subtitle: {
                text: subTitle
            },
            xAxis: {
                categories: ['7:00', '8:00', '9:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00'],
                title: {
                    text: 'Time',
                    align: 'high'
                }
            },
            yAxis: {
                min: 0,
                title: {
                    text: 'Sales',
                    align: 'high'
                },
                labels: {
                    overflow: 'justify'
                }
            },
            tooltip: {
                enabled: false,
                valueSuffix: ' Dollars'
            },
            plotOptions: {
                bar: {
                    dataLabels: {
                        enabled: true
                    }
                }
            },
            legend: {
                enabled: false,
                layout: 'vertical',
                align: 'right',
                verticalAlign: 'top',
                x: -100,
                y: 100,
                floating: true,
                borderWidth: 1,
                backgroundColor: '#FFFFFF',
                shadow: true
            },
            credits: {
                enabled: false
            },
            series: [{
                name: 'Sales',
                data: sales
            }]
        });
    };
    
    var handleMarkerClick = function(map, marker) {
        var hasSalesData = marker.get("hasSalesData");
        if (hasSalesData) {
            infowindow.open(map, marker);
            infowindow.set("marker", marker);
        } else {
            showMessageDialog("no-sales-data-dialog");    
        }
    };
    
    var handleSearch = function() {
        var date = $("#datepicker").val();
        var time = $('#timepicker').val() + ":00"; 
        
        if (salesData) {
            var times;
            $.each(salesData, function(index, item) { // Check the date
                if (date === item["date"]) {
                    times = item["times"];
                }
            });
            
            var locations;
            if (times) {
                $.each(times, function(index, item) { // Check the time
                    if (time === item["time"]) {
                        locations = item["locations"];    
                    }   
                });
            }
            
            if (locations) {
                deleteMarkers();
                $.each(locations, function(index, item) { // Set marker by sales
                    var address = item["address"]; 
                    var sales = item["amt"];
                    if ((0 <= sales) && (sales <= 1000)) {
                        setMarker(address, "red", date, times, true);
                    } else if ((1000 < sales) && (sales <= 4000)) {
                        setMarker(address, "yellow", date, times, true);
                    } else if (4000 < sales) {
                        setMarker(address, "green", date, times, true);
                    }  
                });
            } else {
                showMessageDialog("data-not-available-dialog");
            } 
        }
    };
    
    var initializeMarkers = function() {
        if (salesData) {
            var locations = salesData[0]["times"][0]["locations"];
            $.each(locations, function(index, item) {
                setMarker(item["address"], "red", null, null, false);
            });
        }
    }; 
    
    var deleteMarkers = function() {
        if (markersArray) {
            for (i in markersArray) {
                markersArray[i].setMap(null);
            }
            markersArray.length = 0;
        }
    };
    
    var setMarker = function(address, color, date, times, hasSalesData) {
        geocoder.geocode({ 'address': address + " Vancouver BC"}, function(results, status) {
            if (status == google.maps.GeocoderStatus.OK) {
                var iconUrl = "http://maps.google.com/mapfiles/ms/icons/red-dot.png";
                switch (color) {
                    case "yellow":
                        iconUrl = "http://maps.google.com/mapfiles/ms/icons/yellow-dot.png";
                        break;
                    case "green":
                        iconUrl = "http://maps.google.com/mapfiles/ms/icons/green-dot.png";
                        break;
                }
                var marker = new google.maps.Marker({
                    icon: iconUrl,
                    map: map,
                    position: results[0].geometry.location
                });
                marker.set("address", address);
                marker.set("date", date);
                marker.set("times", times);
                marker.set("hasSalesData", hasSalesData);
                
                markersArray.push(marker);
                
                google.maps.event.addListener(marker, 'click', function() {
                    handleMarkerClick(map, marker);
                });

            } else {
                alert('Geocode was not successful for the following reason: ' + status);
            }
        });
    };
    
    var showMessageDialog = function (dialogId) {
        $("#" + dialogId).modal({
            closeHTML: "<a href='#' title='Close' class='modal-close'>x</a>",
            position: ["40%","30%"],
            minHeight: 145,
            maxHeight: 145,
            minWidth: 300,
            maxWidth: 300,
            overlayId: "dialog-overlay",
            containerId: "dialog-container", 
            onShow: function(dialog) {
	            var modal = this;
	            $(".ok", dialog.data[0]).click(function() {
		            modal.close(); 
	            });
            }
        }); 
    };
    
    return {
        init: function() {
            initializeUI();
            
            $.ajax({
                url: "/acmecoffee/data/data.json",
                type: "GET",
                dataType: "json",
                cache: false,
                timeout: 20 * 1000,
                success: function(data, textStatus, jqXHR) {
                    salesData = data.data;
                    initializeMap();
                },
                error: function(jqXHR, textStatus, errorThrown) {
                    alert('Could not load sales data: ' + textStatus);
                }
            });
        }
    };
}());

////////////////////////////////////////////////////////////////////////////
// Bootstrap function.
////////////////////////////////////////////////////////////////////////////
function runAcmeCoffee() {
    AcmeCoffeeModule.init();
}
window['runAcmeCoffee'] = runAcmeCoffee;