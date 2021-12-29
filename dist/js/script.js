API.Plugins.files = {
	init:function(){
		API.GUI.Sidebar.Nav.add('files', 'main_navigation');
	},
	load:{
		index:function(){},
		details:function(){},
	},
	Timeline:{
		icon:"file-download",
		object:function(dataset,layout,options = {},callback = null){
			if(options instanceof Function){ callback = options; options = {}; }
			var defaults = {icon: API.Plugins.files.Timeline.icon,color: "warning"};
			for(var [key, option] of Object.entries(options)){ if(API.Helper.isSet(defaults,[key])){ defaults[key] = option; } }
			if(typeof dataset.id !== 'undefined'){
				var dateItem = new Date(dataset.created);
				var dateUS = dateItem.toLocaleDateString('en-US', {day: 'numeric', month: 'short', year: 'numeric'}).replace(/ /g, '-').replace(/,/g, '');
				API.Builder.Timeline.add.date(layout.timeline,dataset.created);
				var checkExist = setInterval(function() {
					if(layout.timeline.find('div.time-label[data-dateus="'+dateUS+'"]').length > 0){
						clearInterval(checkExist);
						API.Builder.Timeline.add.filter(layout,'files','Files');
						var html = '<div data-plugin="files" data-id="'+dataset.id+'" data-date="'+dateItem.getTime()+'">';
							html += '<i class="fas fa-'+defaults.icon+' bg-'+defaults.color+'"></i>';
							html += '<div class="timeline-item">';
								html += '<span class="time"><i class="fas fa-clock mr-2"></i><time class="timeago" datetime="'+dataset.created.replace(/ /g, "T")+'">'+dataset.created+'</time></span>';
								html += '<h3 class="timeline-header border-0">'+dataset.filename+'('+API.Helper.getFileSize(dataset.size)+') was uploaded</h3>';
							html += '</div>';
						html += '</div>';
						layout.timeline.find('div.time-label[data-dateus="'+dateUS+'"]').after(html);
						var element = layout.timeline.find('[data-plugin="files"][data-id="'+dataset.id+'"]');
						element.find('time').timeago();
						var items = layout.timeline.children('div').detach().get();
						items.sort(function(a, b){
							return new Date($(b).data("date")) - new Date($(a).data("date"));
						});
						layout.timeline.append(items);
						element.find('i').first().addClass('pointer');
						element.find('i').first().off().click(function(){
							console.log('Download')
						});
						if(callback != null){ callback(element); }
					}
				}, 100);
			}
		},
	},
}

API.Plugins.files.init();
