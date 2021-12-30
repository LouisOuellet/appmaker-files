API.Plugins.files = {
	init:function(){
		API.GUI.Sidebar.Nav.add('files', 'main_navigation');
	},
	load:{
		index:function(){},
		details:function(){},
	},
	upload:function(layout){
		if(API.Auth.validate('plugin', 'files', 2)){
			var url = new URL(window.location.href);
			API.Builder.modal($('body'), {
				title:'Upload',
				icon:'upload',
				zindex:'top',
				css:{ dialog: "modal-lg", header: "bg-purple", body: "p-3"},
			}, function(modal){
				modal.on('hide.bs.modal',function(){ modal.remove(); });
				var dialog = modal.find('.modal-dialog');
				var header = modal.find('.modal-header');
				var body = modal.find('.modal-body');
				var footer = modal.find('.modal-footer');
				header.find('button[data-control="hide"]').remove();
				header.find('button[data-control="update"]').remove();
				API.Builder.dropzone(body,function(action,zone,data){
					switch(action){
						case"sending":
							var checkStatus = setInterval(function(){
								if(data.status != "success" && data.status != "uploading"){
									console.log(data.status);
									clearInterval(checkStatus);
								}
								if(data.status == "success"){
									clearInterval(checkStatus);
									var reader = new FileReader();
					        reader.addEventListener("loadend",function(event){
										var file = {
											filename:data.name,
											dataURL:event.target.result,
											size:data.size,
											relationship:url.searchParams.get("p"),
											link_to:url.searchParams.get("id"),
										};
										if(API.debug){ console.log(file); }
										API.request('files','upload',{data:file},function(result){
											var response = JSON.parse(result);
											if(response.success != undefined){
												if(API.Helper.isSet(layout,['timeline'])){
													API.Plugins.files.Timeline.object(response.output.file,layout);
												}
												if(API.Helper.isSet(layout,['details']) && layout.details.find('td[data-plugin="'+url.searchParams.get("p")+'"][data-key="files"]').length > 0){
													var td = layout.details.find('td[data-plugin="'+url.searchParams.get("p")+'"][data-key="files"]');
													td.prepend(API.Plugins.files.Layouts.details.GUI.button(response.output.file,{download:API.Auth.validate('custom', url.searchParams.get("p")+'_files', 1)}));
													td.find('button[data-action="view"').off().click(function(){
													  API.Plugins.files.view($(this).attr('data-id'));
													});
													td.find('button[data-action="download"]').off().click(function(){
													  API.Plugins.files.download($(this).attr('data-id'));
													});
												}
												if(API.Helper.isSet(layout,['content','files'])){
													API.Plugins.files.Layouts.details.GUI.addRow(response.output.file,layout);
												}
											}
										});
									});
					        reader.readAsDataURL(data);
								}
							}, 100);
							break;
						case"queuecomplete":
							if(API.debug){ console.log(action,zone,data); }
							modal.modal('hide');
							break;
						default:
							if(API.debug){ console.log(action,zone,data); }
							break;
					}
				});
				modal.modal('show');
			});
		}
	},
	delete:function(id,name,layout){
		if(API.Auth.validate('plugin', 'files', 4)){
			var url = new URL(window.location.href);
			API.Builder.modal($('body'), {
				title:'Are you sure?',
				icon:'delete',
				zindex:'top',
				css:{ header: "bg-danger", body: "p-3"},
			}, function(modal){
				modal.on('hide.bs.modal',function(){ modal.remove(); });
				var dialog = modal.find('.modal-dialog');
				var header = modal.find('.modal-header');
				var body = modal.find('.modal-body');
				var footer = modal.find('.modal-footer');
				header.find('button[data-control="hide"]').remove();
				header.find('button[data-control="update"]').remove();
				body.html(API.Contents.Language['Are you sure you want to delete']+'<strong class="ml-2">'+name+'</strong>?');
				footer.append('<button class="btn btn-danger" data-action="delete"><i class="fas fa-trash-alt mr-1"></i>'+API.Contents.Language['Delete']+'</button>');
				footer.find('button[data-action="delete"]').off().click(function(){
					API.request('files','delete',{data:{id:id}},function(result){
						var data = JSON.parse(result);
						if(data.success != undefined){
							if(API.Helper.isSet(layout,['timeline'])){
								layout.timeline.find('div[data-plugin="files"][data-id="'+data.output.file.id+'"]').remove();
							}
							if(API.Helper.isSet(layout,['details']) && layout.details.find('td[data-plugin="'+url.searchParams.get("p")+'"][data-key="files"]').length > 0){
								layout.details.find('td[data-plugin="'+url.searchParams.get("p")+'"][data-key="files"]').find('div[data-id="'+data.output.file.id+'"]').remove();
							}
							if(API.Helper.isSet(layout,['content','files'])){
								layout.content.files.find('tr[data-id="'+data.output.file.id+'"]').remove();
							}
						}
					});
					modal.modal('hide');
				});
				modal.modal('show');
			});
		}
	},
	download:function(id){
		if(API.Auth.validate('plugin', 'files', 1)){
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
		}
	},
	view:function(id){
		if(API.Auth.validate('plugin', 'files', 1)){
			API.request('files','download',{data:{id:id}},function(result){
				var data = JSON.parse(result);
				if(data.success != undefined){
					API.Builder.modal($('body'), {
						title:'Viewport',
						icon:'viewport',
						zindex:'top',
						css:{ dialog: "modal-full", header: "bg-primary", body: "p-0"},
					}, function(modal){
						modal.on('hide.bs.modal',function(){ modal.remove(); });
						var dialog = modal.find('.modal-dialog');
						var header = modal.find('.modal-header');
						var body = modal.find('.modal-body');
						var footer = modal.find('.modal-footer');
						header.find('button[data-control="hide"]').remove();
						header.find('button[data-control="update"]').remove();
						footer.remove();
						body.append('<iframe class="view-iframe"></iframe>');
						var iframe = body.find('iframe');
						iframe.attr('src',data.output.file.dirname+'/'+data.output.file.filename);
						modal.modal('show');
					});
				}
			});
		}
	},
	Timeline:{
		icon:"file",
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
							API.Plugins.files.view($(this).parent().attr('data-id'));
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
							td.append(API.Plugins.files.Layouts.details.GUI.button(file,{download:API.Auth.validate('custom', url.searchParams.get("p")+'_files', 1),download:API.Auth.validate('custom', url.searchParams.get("p")+'_files', 4)}));
							td.find('button[data-action="view"').off().click(function(){
								API.Plugins.files.view($(this).attr('data-id'));
							});
							td.find('button[data-action="download"]').off().click(function(){
								API.Plugins.files.download($(this).attr('data-id'));
							});
							td.find('button[data-action="delete"]').off().click(function(){
								API.Plugins.files.delete($(this).attr('data-id'),$(this).attr('data-name'),layout);
							});
						}
					}
					if(API.Auth.validate('custom', url.searchParams.get("p")+'_files', 2)){
						td.append('<button type="button" class="btn btn-xs btn-success mx-1" data-action="upload"><i class="fas fa-file-upload"></i></button>');
						td.find('button[data-action="upload"]').off().click(function(){
							API.Plugins.files.upload(layout);
						});
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
					var search = content.find('div.row').eq(0);
					var files = content.find('div.row').eq(1);
					search.find('div[data-action="clear"]').off().click(function(){
						$(this).parent().find('input').val('');
						files.find('[data-csv]').show();
					});
					search.find('input').off().on('input',function(){
						if($(this).val() != ''){
							files.find('[data-csv]').hide();
							files.find('[data-csv*="'+$(this).val().toLowerCase()+'"]').each(function(){ $(this).show(); });
						} else { files.find('[data-csv]').show(); }
					});
					search.find('button[data-action="upload"]').off().click(function(){
						API.Plugins.files.upload(layout);
					});
					if(API.Helper.isSet(data,['relations','files'])){
						for(var [id, file] of Object.entries(data.relations.files)){
							API.Plugins.files.Layouts.details.GUI.addRow(file,layout);
						}
					}
				});
				if(callback != null){ callback(dataset,layout); }
			},
			GUI:{
				button:function(dataset,options = {},callback = null){
					var url = new URL(window.location.href);
					if(options instanceof Function){ callback = options; options = {}; }
					var defaults = {download: API.Auth.validate('plugin', 'files', 1),delete: API.Auth.validate('plugin', 'files', 4)};
					for(var [key, option] of Object.entries(options)){ if(API.Helper.isSet(defaults,[key])){ defaults[key] = option; } }
					var html = '<div class="btn-group m-1" data-id="'+dataset.id+'">';
						html += '<button type="button" class="btn btn-xs bg-primary" data-id="'+dataset.id+'" data-action="view"><i class="fas fa-file mr-1"></i>'+dataset.filename+'</button>';
						if(defaults.download){
							html += '<button type="button" class="btn btn-xs bg-warning" data-id="'+dataset.id+'" data-action="download"><i class="fas fa-file-download mr-1"></i>'+API.Helper.getFileSize(dataset.size)+'</button>';
						}
						if(defaults.delete){
							html += '<button type="button" class="btn btn-xs bg-danger" data-id="'+dataset.id+'" data-name="'+dataset.filename+'" data-action="delete"><i class="fas fa-trash-alt"></i></button>';
						}
					html += '</div>';
					if(callback != null){ callback(dataset,html); }
					return html;
				},
				addRow:function(dataset,layout,options = {},callback = null){
					var url = new URL(window.location.href);
					if(options instanceof Function){ callback = options; options = {}; }
					var defaults = {view: API.Auth.validate('plugin', 'files', 1),list: API.Auth.validate('plugin', 'files', 1),download: API.Auth.validate('plugin', 'files', 1),delete: API.Auth.validate('plugin', 'files', 4)};
					for(var [key, option] of Object.entries(options)){ if(API.Helper.isSet(defaults,[key])){ defaults[key] = option; } }
					var body = layout.content.files.find('tbody');
					var meta = {};
					if(dataset.meta != ''){ meta = JSON.parse(dataset.meta); }
					if(defaults.list){
						var html = '<tr data-csv="'+API.Helper.toCSV(dataset)+'" data-id="'+dataset.id+'">';
							html += '<td class="pointer" data-id="'+dataset.id+'">'+dataset.filename+'</td>';
							html += '<td class="pointer" data-id="'+dataset.id+'">'+API.Helper.getFileSize(dataset.size)+'</td>';
							html += '<td class="pointer" data-id="'+dataset.id+'"></td>';
							html += '<td>';
								html += '<div class="btn-group btn-block m-0">';
									if(defaults.download){
										html += '<button class="btn btn-xs btn-warning" data-id="'+dataset.id+'" data-action="download"><i class="fas fa-file-download mr-1"></i>'+API.Contents.Language['Download']+'</button>';
									}
									if(defaults.delete){
										html += '<button class="btn btn-xs btn-danger" data-id="'+dataset.id+'" data-name="'+dataset.filename+'" data-action="delete"><i class="fas fa-trash-alt"></i></button>';
									}
								html += '</div>';
							html += '</td>';
						html += '</tr>';
						body.append(html);
						var tr = body.find('tr').last();
						if(defaults.view){
							tr.find('.pointer').off().click(function(){
								API.Plugins.files.view($(this).attr('data-id'));
							});
						}
						if(defaults.download){
							tr.find('button[data-action="download"]').off().click(function(){
								API.Plugins.files.download($(this).attr('data-id'));
							});
						}
						if(defaults.delete){
							tr.find('button[data-action="delete"]').off().click(function(){
								API.Plugins.files.delete($(this).attr('data-id'),$(this).attr('data-name'),layout);
							});
						}
					}
					if(callback != null){ callback(dataset,layout,tr); }
				},
			},
		},
	},
}

API.Plugins.files.init();
