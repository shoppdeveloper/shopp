/*!
 * orders.js - Behaviors for the order manager
 * Copyright © 2011 by Ingenesis Limited. All rights reserved.
 * Licensed under the GPLv3 {@see license.txt}
 */

jQuery(document).ready( function($) {

	$.template('shipment-ui', $('#shipment-ui'));
	$.template('shipnotice-ui', $('#shipnotice-ui'));
	$.template('refund-ui', $('#refund-ui'));
	$.template('address-ui', $('#address-editor'));
	$.template('customer-ui', $('#customer-editor'));
	$.template('customer-select', $('#customer-selector'));
	$.template('change-customer', $('#change-customer-ui'));
	$.template('total-editor', $('#total-editor-ui'));
	$.template('item-editor', $('#item-editor-ui'));

	var manager = $('#order-manage'),
		managerui = manager.find('div.manager-ui'),

		cmo = '',
		ctr = $.each(carriers,function (code,carrier) {
			cmo += '<option value="'+code+'">'+carrier[0]+'</option>';
		}),

		shipbtn = $('#shipnote-button').click(function (e) {
			e.preventDefault();
			var $this = $(this).hide(),
				shipments = [],
				ui = $.tmpl('shipnotice-ui',{shipmentnum:2}),
				addshipli = ui.find('ol li'),

				upaddshipnum = function () {
					addshipli.find('span.number').text(shipments.length+1+'.');
				},

				addbtn = ui.find('#addship-button').click(function (e) {
					e.preventDefault();

					var shipnum = shipments.length,
						shipment = $.tmpl('shipment-ui',{id:shipnum,num:shipnum+1}),

						carriermenu = shipment.find('select').html(cmo),

						tracking = shipment.find('.tracking').change(function () {
							var tracknum = $(this).val().toUpperCase().replace(/[^A-Z0-9]/,'');
							$.each(carriers,function (c,r) {
								if (tracknum.match( new RegExp(r[1].substr( 1,r[1].length-2 )) ) != null) {
									carriermenu.val(c);
									return false;
								}
							});
						}),

						deletebtn = shipment.find('button.delete').click(function (e) {
							e.preventDefault();
							shipment.remove();
							shipments.splice(shipnum,1);
							upaddshipnum();

						}).hide();

					if (shipnum > 0)
						shipment.hover(function() {deletebtn.show();},function () {deletebtn.fadeOut('fast');});
					shipments.push(shipment.insertBefore(addshipli));
					upaddshipnum();

				}).click(),

				cancel = ui.find('#cancel-ship').click(function (e) {
					e.preventDefault();
					ui.fadeRemove('fast',function () {
						$this.show();
					});
				});

				managerui.empty().append(ui);
		}),

		refundbtn = $('#cancel-order, #refund-button').click(function (e) {
			e.preventDefault();

			var $this = $(this).attr('disabled',true),
				data = ('refund-button' == $this.attr('id') ?
					{ action:'refund',title:$om.ro,cancel:$om.cancel,send:$om.stg,process:$om.pr,reason: $om.rr } :
					{ action:'cancel',title:$om.co,cancel:$om.dnc,send:$om.stg,process:$om.co,reason: $om.rc,disable_amount: ' disabled="disabled"' }),
				ui = $.tmpl('refund-ui',data),

				cancel = ui.find('#cancel-refund').click(function (e) {
					e.preventDefault();
					ui.fadeRemove('fast',function () {
						$this.show();
					});

				});

				managerui.empty().append(ui);
		}),

		printbtn = $( '#print-button' ).click( function (e) {
			e.preventDefault();
			var frame = $( '#print-receipt' ).get( 0 ), fw = frame.contentWindow;

			// Which browser agent?
			var trident = ( -1 !== navigator.userAgent.indexOf( "Trident" ) ); // IE
			var presto = ( -1 !== navigator.userAgent.indexOf( "Presto" ) ); // Opera (pre-webkit)

			if ( trident || presto ) {
				var preview = window.open( fw.location.href+"&print=auto" );
				$( preview ).load( function () {	preview.close(); } );
			} else {
				fw.focus();
				fw.print();
			}
			return false;
		} );

		editaddress = function (type) {
			var $this = $(this),
				data = address[ type ],
				ui = $.tmpl('address-ui',data),
				editorui = $('#' + type + '-address-editor'),
				display = $('#order-' + type + ' .display'),


				cancel = ui.find('#cancel-edit-address').click(function (e) {
					e.preventDefault();
					ui.fadeRemove('fast',function () {
						$this.show();
						display.show();
					});

				});

			ui.find('#' + type + '-state-menu').html(data.statemenu);
			ui.find('#' + type + '-country').html(data.countrymenu).upstate();

			display.hide();
			editorui.hide().empty().append(ui).slideDown('fast');

		},

		billaddrctrls = $('#edit-billing-address, #order-billing address').click(function (e) {
			e.preventDefault();
			editaddress('billing');
			return false;
		}),

		billaddrctrls = $('#edit-shipping-address, #order-shipto address').click(function (e) {
			e.preventDefault();
			editaddress('shipping');
			return false;
		}),

		editcustomer = $('#edit-customer').click(function (e) {
			e.preventDefault();
			var $this = $(this),
				ui = $.tmpl('customer-ui',customer),
				editorui = $('#customer-editor-form'),
				display = $('#order-contact .display'),
				panel = $('#order-contact .inside'),
				cancel = function (e) {
					e.preventDefault();
					ui.fadeRemove('fast',function () {
						$this.show();
						display.show();
					});
				},
				change = ui.find('#change-customer').click(function (e) {
					e.preventDefault();
					editorui.hide();
					ui = $.tmpl('change-customer');
					ui.find('#select-customer').selectize({
						valueField:  'id',
						labelField:  'name',
						searchField: ['firstname', 'lastname', 'email'],
						openOnFocus: true,
						diacritics: true,
						maxOptions: 7,
						create: false,
						render: {
							item: function (item, escape) {
								editline(item);
								if ( item.variant != '' )
									return '<div><span class="name">' + escape(item.name) + '</span><span class="variant">' + escape(item.variant) + '</span></div>';
								else return '<div><span class="name">' + escape(item.name) + '</span></div>';
							},
							option: function (item, escape) {
								if ( item.variant != '' )
									return '<div><span class="name">' + escape(item.name) + '</span><span class="variant">' + escape(item.variant) + '</span> <span class="price">' + escape(asMoney(item.unitprice)) +  '</span></div>';
								else return '<div><span class="name">' + escape(item.name) + '</span> <span class="price">' + escape(asMoney(item.unitprice)) +  '</span></div>';
							},
						},
					    load: function(query, callback) {
					        if (!query.length) return callback();
							var $select = $(this);
					        $.ajax({
					            url: $select.closest('form').attr('action') + '&s=' + encodeURIComponent(query),
					            type: 'GET',
					            error: function() {
					                callback();
					            },
					            success: function(r) {
									callback(r);
									// If a pure number is given and only one result is found, auto-select it
									if ( ! isNaN(query) && 1 == r.length )
										$select[0].addItem(r[0].id);
					            }
					        });
					    }
					});

					var changeui = $('#change-customer-editor').empty().append(ui).slideDown('fast');

					var results = changeui.find('#customer-search-results').hide(),
						changebutton = changeui.find('.change-button').hide(),
						cancelchange = $('#cancel-change-customer').hide(),
						editcancel = ui.find('#cancel-edit-customer').click(cancel),
						searching = $('#customer-search').submit(function (e) {
							$('#change-customer').hide();
							cancelchange.show().click(cancel);
							results.show();
						});
				}),
				caneledit = ui.find('#cancel-edit-customer').click(cancel);

			display.hide();
			editorui.hide().empty().append(ui).slideDown('fast');
			return false;
		});

		// close postboxes that should be closed
		$('.if-js-closed').removeClass('if-js-closed').addClass('closed');
		postboxes.add_postbox_toggles('toplevel_page_shopp-orders');

		$('.postbox a.help').click(function () {
			$(this).colorbox({iframe:true,open:true,innerWidth:768,innerHeight:480,scrolling:false});
			return false;
		});

		$('#notification').hide();
		$('#notify-customer').click(function () {
			$('#notification').animate({
				height:  "toggle",
				opacity: "toggle"
			}, 500);
		});

		$('#notation').hide();
		$('#add-note-button').click(function (e) {
			e.preventDefault();
			$('#add-note-button').hide();
			$('#notation').animate({
				height:  "toggle",
				opacity: "toggle"
			}, 500);
		});

		$('#cancel-note-button').click(function (e) {
			e.preventDefault();
			$('#add-note-button').animate({opacity:"toggle"},500);
			$('#notation').animate({
				height:  "toggle",
				opacity: "toggle"
			}, 500);
		});

		$('#order-notes table tr').hover(function () {
			$(this).find('.notectrls').animate({
				opacity:"toggle"
			}, 500);

		},function () {
			$(this).find('.notectrls').animate({
				opacity:"toggle"
			}, 100);

		});

		$('td .deletenote').click(function (e) {
			if (!confirm('Are you sure you want to delete this note?'))
				e.preventDefault();
		});

		$('td .editnote').click(function () {
			var editbtn = $(this).attr('disabled',true).addClass('updating'),
				cell = editbtn.parents('td'),
				note = cell.find('div'),
				ctrls = cell.find('span.notectrls'),
				meta = cell.find('p.notemeta'),
				idattr = note.attr('id').split("-"),
				id = idattr[1];
			$.get(noteurl+'&action=shopp_order_note_message&id='+id,false,function (msg) {
				editbtn.removeAttr('disabled').removeClass('updating');
				if (msg == '1') return;
				var editor = $('<textarea name="note-editor['+id+']" cols="50" rows="10" />').val(msg).prependTo(cell);
					ui = $('<div class="controls alignright">'+
							'<button type="button" name="cancel" class="cancel-edit-note button-secondary">Cancel</button>'+
							'<button type="submit" name="edit-note['+id+']" class="save-note button-primary">Save Note</button></div>').appendTo(meta),
					cancel = ui.find('button.cancel-edit-note').click(function () {
							editor.remove();
							ui.remove();
							note.show();
							ctrls.addClass('notectrls');
						});
				note.hide();
				ctrls.hide().removeClass('notectrls');
			});

		});


		function editline (item) {
			if ( undefined == item.variant ) item.variant = '';
			data = {
				id: item.id,
				itemname: item.name + ( '' != item.variant ? ': ' + item.variant : ''),
				quantity: item.quantity > 0 ? item.quantity : 1,
				unitprice: item.unitprice,
			},
			ui = $.tmpl('item-editor', data);
			editui(ui);
			$('#order-items').append($('<tr></tr>').append(ui)); // @todo: add tr classes for alteranating rows
			ui.find('#edit-item').focus();
		}

		function editui ( ui ) {

			var edit = '#edit-',
				$chooseButton = ui.find('.choose-product'),
				$selector = ui.find('.select-product')
				$unitprice = ui.find(edit + 'unitprice'),
				$qty = ui.find(edit + 'qty'),
				$total = ui.find(edit + 'total');

			function retotal () {
				$total.val( asMoney( $qty.val() * asNumber( $unitprice.val() ) ));
			}

			$unitprice.change(function () {
				retotal();
				$unitprice.val( asMoney($unitprice.val()) );
			}).change();

			// Handle line item total calculations
			$qty.change(retotal).change();


			// Order editing
			$chooseButton.on('click', function (e) {
				e.preventDefault();
				ui.find(edit + 'item').hide();
				ui.find('.selectize-control .selectize-input').show().click();
			});

			$selector.selectize({
				valueField:  'id',
				labelField:  'name',
				searchField: ['name', 'variant'],
				openOnFocus: true,
				diacritics: true,
				maxOptions: 7,
				create: false,
				render: {
					item: function (item, escape) {
						$unitprice.val(item.unitprice).change();
						if ( item.variant != '' )
							return '<div><span class="name">' + escape(item.name) + '</span><span class="variant">' + escape(item.variant) + '</span></div>';
						else return '<div><span class="name">' + escape(item.name) + '</span></div>';
					},
					option: function (item, escape) {
						if ( item.variant != '' )
							return '<div><span class="name">' + escape(item.name) + '</span><span class="variant">' + escape(item.variant) + '</span> <span class="price">' + escape(asMoney(item.unitprice)) +  '</span></div>';
						else return '<div><span class="name">' + escape(item.name) + '</span> <span class="price">' + escape(asMoney(item.unitprice)) +  '</span></div>';
					},
				},
			    load: function(query, callback) {
			        if (!query.length) return callback();
					var $select = $(this);
			        $.ajax({
			            url: producturl + '&action=shopp_select_product&s=' + encodeURIComponent(query),
			            type: 'GET',
			            error: function() {
			                callback();
			            },
			            success: function(r) {
							callback(r);
							// If a pure number is given and only one result is found, auto-select it
							if ( ! isNaN(query) && 1 == r.length )
								$select[0].addItem(r[0].id);
			            }
			        });
			    },
				onInitialize: function () {
					$(this.$control).hide();
				}
			});
		}

		var editing = $('tr.editing');
		if ( editing.length > 0 )
			editui(editing);

		var addproduct = $('.add-product').selectize({
			valueField:  'id',
			labelField:  'name',
			searchField: ['name', 'variant'],
			openOnFocus: true,
			diacritics: true,
			maxOptions: 7,
			create: true,
			render: {
				item: function (item, escape) {
					editline(item);
					if ( item.variant != '' )
						return '<div><span class="name">' + escape(item.name) + '</span><span class="variant">' + escape(item.variant) + '</span></div>';
					else return '<div><span class="name">' + escape(item.name) + '</span></div>';
				},
				option: function (item, escape) {
					if ( item.variant != '' )
						return '<div><span class="name">' + escape(item.name) + '</span><span class="variant">' + escape(item.variant) + '</span> <span class="price">' + escape(asMoney(item.unitprice)) +  '</span></div>';
					else return '<div><span class="name">' + escape(item.name) + '</span> <span class="price">' + escape(asMoney(item.unitprice)) +  '</span></div>';
				},
			},
		    load: function(query, callback) {
		        if (!query.length) return callback();
				var $select = $(this);
		        $.ajax({
		            url: producturl + '&action=shopp_select_product&s=' + encodeURIComponent(query),
		            type: 'GET',
		            error: function() {
		                callback();
		            },
		            success: function(r) {
						callback(r);
						// If a pure number is given and only one result is found, auto-select it
						if ( ! isNaN(query) && 1 == r.length )
							$select[0].addItem(r[0].id);
		            }
		        });
		    },
			onItemAdd: function (value, $item) {
				this.clear();
				this.clearOptions();
			}
		});

		// Handle UPC scanning
		var scancode = '';
		$(document).keypress(function (e) {
			var key = String.fromCharCode(e.which);
			if ( 13 == e.which && '' != scancode )
				$('.add-product .selectize-input').show().click().find('input').val(scancode).change();
			if ( key.match(/\d/) ) scancode += key;
			else scancode = '';
		});

		var $ordertotals = $('#order-totals'),
			totalgroups = [],
			retotal = function () {
				var subtotal = parseFloat($ordertotals.find('tr.subtotal td.money').attr('data-value')),
					fees = [],
					totals = 0,
					types = ['fee', 'tax', 'shipping', 'discount'],
					$fees = $.each(types, function (i,type) {
						var fields = $ordertotals.find('tr.total-editor td.money input.'+type);
						fees[type] = 0;
						$ordertotals.find('tr.total-editor td.money input.'+type).each(function () {
							fees[type] += asNumber($(this).val());
						});
						if ( fields.length > 0 ) $('#'+type+'-total').val(asMoney(fees[type]));
						else fees[type] = asNumber($('#'+type+'-total').val());
						if ( 'discount' == type ) fees['discount'] *= -1;
						totals += fees[type];
					});
					$total = $('#order-total').val(subtotal + totals).change();
			},
			feeChanges = function () {
				var $this = $(this);
				if ( $this.data('initialValue') != $this.val() )
					$ordertotals.addClass('changed');

				toggleAddButton($this);
				retotal();
			},
			toggleAddButton = function ( $this ) {
				var addButton = $this.parent().find('.add');
				if ( 0 == asNumber($this.val()) ) {
					addButton.hide();
				} else {
					addButton.show().closest('tr').removeClass('empty');
				}
			}
			lineEditing = function (ui) {
				var deleteButton = ui.find('button.delete').click(function() {
						ui.fadeOut('fast', function () {
							ui.remove();
							if ( $ordertotals.find('tr.total-editor td.money input.' + type).length == 0 ) {
								$('#'+type+'-total').removeAttr('readonly');
							}
							retotal();
						});
					}),
					addButton = ui.find('button.add').click(function(e) {
						addLineEditor(e, ui);
					})
					field = ui.find('td.money input.money').change(feeChanges).money().selectall().change();
			},
			addLineEditor = function (e, insert) {
					console.log('addLineEditor');
				e.preventDefault();
				var $this = $(e.currentTarget),
					row = $this.closest('tr'),
					type = $this.val(),
					ui = $.tmpl('total-editor', { placeholder: $this.attr('data-label'), label: $this.attr('data-label'), type: type, amount: 0.00 }),
					cells = ui.find('td').hide(), done = false,
					inputs = cells.find('input'),
					label = ui.find('input.labeling');

				if ( totalgroups[type] === undefined ) totalgroups[type] = $(ui).add(row);
				else totalgroups[type] = $(totalgroups[type]).add(ui);

				inputs.focus(function () {
					totalgroups[type].addClass('edit-group');
				}).blur(function () {
					totalgroups[type].removeClass('edit-group');
				})

				lineEditing(ui);

				if (insert) ui.insertBefore(insert);
				else ui.insertBefore(row);

				cells.slideDown('fast');
				label.focus();

				return ui;
			},
			startLineEditor = function (e) {
				e.preventDefault();
				var $this = $(this),
					$label = $this.parent().parent().find('td.label'),
					$totalrow = $this.closest('tr'),
					$total = $totalrow.find('input.money').prop('readonly',true).addClass('subtotal'),
					total = $total.val(),
					$copy = addLineEditor(e);

					$label.html($label.html() + ' ' + $l10n.total);
					$copy.find('input.money').val(total).change();
					$copy.find('input.labeling').focus(); // Refocus on first label (for tab order)

			};

		$ordertotals.find('button.add').not('tr.total-editor button.add').click(startLineEditor);
		$ordertotals.find('tr.total-editor').each(function () {
			lineEditing($(this));
		});
		$('#order-totals input.money').not('#order-total').change(feeChanges).each(function () {
			var $this = $(this);
			$this.data('initialValue', $this.val());
			toggleAddButton($this);
		});


});