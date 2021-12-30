API.Plugins.files = {
	init:function(){
		API.GUI.Sidebar.Nav.add('files', 'main_navigation');
	},
	load:{
		index:function(){},
		details:function(){},
	},
	download:function(id){
		API.request('files','download',{data:{id:id}},function(result){
			var data = JSON.parse(result);
			if(data.success != undefined){
				var link = document.createElement("a");
		    link.setAttribute('download', data.output.file.filename);
		    link.href = data.output.file.dirname+'/'+data.output.file.filename;
		    document.body.appendChild(link);
		    link.click();
		    link.remove();
			}
		});
	},
	view:function(id){
		// API.request('files','download',{data:{id:id}},function(result){
		// 	var data = JSON.parse(result);
		// 	if(data.success != undefined){
		// 		var link = document.createElement("a");
		//     link.setAttribute('download', data.output.file.filename);
		//     link.href = data.output.file.dirname+'/'+data.output.file.filename;
		//     document.body.appendChild(link);
		//     link.click();
		//     link.remove();
		// 		// $('body').append('<iframe class="downloadIFRAME"></iframe>');
		// 		// var iframe = $('body').find('iframe.downloadIFRAME').last();
		// 		// console.log(iframe);
		// 		// iframe.attr('src',data.output.file.dirname+'/'+data.output.file.filename);
		// 		// iframe.remove();
		// 	}
		// });
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
								html += '<h3 class="timeline-header border-0">'+dataset.filename+' ('+API.Helper.getFileSize(dataset.size)+') was uploaded</h3>';
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
							API.Plugins.files.download($(this).parent().attr('data-id'));
						});
						if(callback != null){ callback(element); }
					}
				}, 100);
			}
		},
	},
	Layouts:{
		details:{
			detail:function(data,layout,options = {},callback = null){
				if(options instanceof Function){ callback = options; options = {}; }
				var url = new URL(window.location.href);
				var defaults = {field: "files", plugin:url.searchParams.get("p")};
				for(var [key, option] of Object.entries(options)){ if(API.Helper.isSet(defaults,[key])){ defaults[key] = option; } }
				API.Builder.Timeline.add.filter(layout,'files','Files');
				API.GUI.Layouts.details.data(data,layout,defaults,function(data,layout,tr){
					var td = tr.find('td[data-plugin="'+url.searchParams.get("p")+'"][data-key="files"]');
					td.html('');
					if(API.Helper.isSet(data,['relations','files'])){
						for(var [id, file] of Object.entries(data.relations.files)){
							td.append(API.Plugins.files.Layouts.details.GUI.button(file,{download:API.Auth.validate('custom', url.searchParams.get("p")+'_files', 1)}));
						}
					}
					if(API.Auth.validate('custom', url.searchParams.get("p")+'_files', 2)){
						td.append('<button type="button" class="btn btn-xs btn-success mx-1" data-action="upload"><i class="fas fa-file-upload"></i></button>');
					}
					API.Plugins.organizations.Layouts.details.Events(data,layout);
					if(callback != null){ callback(data,layout,tr); }
				});
			},
			tab:function(data,layout,options = {},callback = null){
				if(options instanceof Function){ callback = options; options = {}; }
				var defaults = {};
				for(var [key, option] of Object.entries(options)){ if(API.Helper.isSet(defaults,[key])){ defaults[key] = option; } }
				API.GUI.Layouts.details.tab(data,layout,{icon:"fas fa-file",text:API.Contents.Language["Files"]},function(data,layout,tab,content){
					API.Builder.Timeline.add.filter(layout,'files','Files');
					layout.content.files = content;
					layout.tabs.files = tab;
					var html = '<div class="row p-3">';
						html += '<div class="col-md-12">';
							html += '<div class="input-group">';
								if(API.Auth.validate('plugin', 'files', 2)){
									html += '<div class="btn-group mr-3">';
										html += '<button data-action="upload" class="btn btn-success"><i class="fas fa-file-upload" aria-hidden="true"></i></button>';
									html += '</div>';
								}
								html += '<input type="text" class="form-control">';
								html += '<div class="input-group-append pointer" data-action="clear"><span class="input-group-text"><i class="fas fa-times"></i></span></div>';
								html += '<div class="input-group-append"><span class="input-group-text"><i class="icon icon-search mr-1"></i>'+API.Contents.Language['Search']+'</span></div>';
							html += '</div>';
						html += '</div>';
					html += '</div>';
					html += '<div class="row px-2 py-0">';
						html += '<table class="table table-sm table-striped table-hover mb-0">';
							html += '<thead>';
								html += '<tr>';
									html += '<th data-header="filename">'+API.Contents.Language['Filename']+'</th>';
									html += '<th data-header="size">'+API.Contents.Language['Size']+'</th>';
									html += '<th data-header="meta">'+API.Contents.Language['Meta']+'</th>';
									html += '<th data-header="action">'+API.Contents.Language['Action']+'</th>';
								html += '</tr>';
							html += '</thead>';
							html += '<tbody></tbody>';
						html += '</table>';
					html += '</div>';
					content.append(html);
					if(API.Helper.isSet(data,['relations','files'])){
						for(var [id, file] of Object.entries(data.relations.files)){
							API.Plugins.files.Layouts.details.GUI.addRow(file,layout);
						}
					}
				});
				// API.Plugins.files.Layouts.details.Events(data,layout);
				if(callback != null){ callback(dataset,layout); }
			},
			GUI:{
				button:function(dataset,options = {},callback = null){
					var url = new URL(window.location.href);
					if(options instanceof Function){ callback = options; options = {}; }
					var defaults = {download: false};
					for(var [key, option] of Object.entries(options)){ if(API.Helper.isSet(defaults,[key])){ defaults[key] = option; } }
					var html = '<div class="btn-group m-1" data-id="'+dataset.id+'">';
						html += '<button type="button" class="btn btn-xs bg-primary"><i class="fas fa-file mr-1"></i>'+dataset.filename+'</button>';
						if(defaults.download){
							html += '<button type="button" class="btn btn-xs bg-warning" data-id="'+dataset.id+'" data-name="'+dataset.name+'" data-action="download"><i class="fas fa-file-download mr-1"></i>'+API.Helper.getFileSize(dataset.size)+'</button>';
						}
					html += '</div>';
					if(callback != null){ callback(dataset,html); }
					return html;
				},
				addRow:function(dataset,layout,options = {},callback = null){
					var url = new URL(window.location.href);
					if(options instanceof Function){ callback = options; options = {}; }
					var defaults = {};
					for(var [key, option] of Object.entries(options)){ if(API.Helper.isSet(defaults,[key])){ defaults[key] = option; } }
					var body = layout.content.files.find('tbody');
					var meta = {};
					if(dataset.meta != ''){ meta = JSON.parse(dataset.meta); }
					var html = '<tr data-csv="'+API.Helper.toCSV(dataset)+'" data-id="'+dataset.id+'">';
						html += '<td class="pointer">'+dataset.filename+'</td>';
						html += '<td class="pointer">'+API.Helper.getFileSize(dataset.size)+'</td>';
						html += '<td class="pointer"></td>';
						html += '<td>';
							html += '<div class="btn-group btn-block m-0">';
								html += '<button class="btn btn-xs btn-warning" data-id="'+dataset.id+'" data-action="download"><i class="fas fa-file-download mr-1"></i>'+API.Contents.Language['Download']+'</button>';
							html += '</div>';
						html += '</td>';
					html += '</tr>';
					body.append(html);
					var tr = body.find('tr').last();
					if(callback != null){ callback(dataset,layout,tr); }
				},
			},
			Events:function(dataset,layout,options = {},callback = null){
				var url = new URL(window.location.href);
				if(options instanceof Function){ callback = options; options = {}; }
				var defaults = {field: "name"};
				for(var [key, option] of Object.entries(options)){ if(API.Helper.isSet(defaults,[key])){ defaults[key] = option; } }
				if(API.Auth.validate('plugin', 'files', 2)){
					layout.content.files.find('button').off().click(function(){
					  if(!layout.content.files.find('textarea').summernote('isEmpty')){
					    var note = {
					      by:API.Contents.Auth.User.id,
					      content:layout.content.files.find('textarea').summernote('code'),
					      relationship:url.searchParams.get("p"),
					      link_to:dataset.this.dom.id,
					      status:dataset.this.raw.status,
					    };
					    layout.content.files.find('textarea').val('');
					    layout.content.files.find('textarea').summernote('code','');
					    layout.content.files.find('textarea').summernote('destroy');
					    layout.content.files.find('textarea').summernote({
					      toolbar: [
					        ['font', ['fontname', 'fontsize']],
					        ['style', ['bold', 'italic', 'underline', 'strikethrough', 'superscript', 'subscript', 'clear']],
					        ['color', ['color']],
					        ['paragraph', ['style', 'ul', 'ol', 'paragraph', 'height']],
					      ],
					      height: 250,
					    });
					    API.request(url.searchParams.get("p"),'file',{data:note},function(result){
					      var data = JSON.parse(result);
					      if(data.success != undefined){
									API.Plugins.files.Timeline.object(data.output.note.dom,layout);
					      }
					    });
					    layout.tabs.find('a').first().tab('show');
					  } else {
					    layout.content.files.find('textarea').summernote('destroy');
					    layout.content.files.find('textarea').summernote({
					      toolbar: [
					        ['font', ['fontname', 'fontsize']],
					        ['style', ['bold', 'italic', 'underline', 'strikethrough', 'superscript', 'subscript', 'clear']],
					        ['color', ['color']],
					        ['paragraph', ['style', 'ul', 'ol', 'paragraph', 'height']],
					      ],
					      height: 250,
					    });
					    alert(API.Contents.Language['File is empty']);
					  }
					});
				}
			},
		},
	},
}

API.Plugins.files.init();
