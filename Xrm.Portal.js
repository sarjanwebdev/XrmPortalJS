/**
 * https://github.com/dynamicscode/XrmPortalJS/blob/master/Xrm.Portal.js
 */

//#region New Control Classes

/**
 * @abstract
 * @class BaseControl
 * Base class for all controls.
 */
class BaseControl {
  /**
   * Creates an instance of BaseControl.
   * @param {jQuery} c - The jQuery element for the control.
   */
  constructor(c) {
    /** @type {jQuery} */
    this.c = c;
    /** @type {string} */
    this.id = $(c).prop("id");
    /** @type {string} */
    this.vg = "";
    /** @type {object} */
    this.s = Xrm.Portal.Utility.Selector;
  }
  /**
   * Sets the validation group.
   * @param {string} g - The validation group.
   * @returns {this} For method chaining.
   */
  setValidationGroup(g) {
    this.vg = g;
    return this;
  }
}

/**
 * @class GenericControl
 * @extends BaseControl
 * Generic control implementation for portal fields.
 */
class GenericControl extends BaseControl {
  /**
   * Creates an instance of GenericControl.
   * @param {jQuery} c - The jQuery element.
   */
  constructor(c) {
    super(c);
    /** @type {HTMLElement|null} */
    this.cc = document.getElementById(this.id + '_cc');
    /** @type {string} */
    this.typ = this.c.is("select.select2-hidden-accessible") ? "select2" : (this.c.is("select") ? "select" : "generic");
  }
  /**
   * Sets the label of the form field.
   * This method updates the HTML content of the label element within the form.
   * @param {string} label - The new label.
   * @returns {this} For chaining.
   */
  setLabel(label) {
    this.c.parent().siblings(".table-info").children("label").html(label);
    return this;
  }
  /**
   * Gets the current label.
   * TODO: Use Xrm.Portal.Utility.Selector.appendLabel
   * @returns {string} The control label.
   */
  getLabel() {
    return this.c.parent().siblings(".table-info").children("label").html();
  }
  /**
   * Gets the current value.
   * @returns {*} The control value.
   */
  getValue() {
    switch (this.typ) {
      case "select2":
        return this.c.select2('data');
      default:
        return this.c.val();
    }
  }
  /**
   * Sets the control value.
   * @param {*} value - The value to set.
   * @param {*} [name] - Optional alternative name (for lookups).
   * @param {*} [logicalName] - Optional entity logical name (for lookups).
   * @returns {this} For chaining.
   */
  setValue(value, name, logicalName) {
    if (value == null) {
      this.c.val(value);
      if (this.cc != null) this.cc.updateView();
      return this;
    }
    function checkMultiselectValue(value) {
      const aval = Array.isArray(value) ? value : [value];
      if (aval.filter(v => v == null || !v.hasOwnProperty('id')).length > 0)
        console.error(`Cannot set value '${JSON.stringify(aval)}'; missing 'id' property.`);
      else aval.forEach(v => v.name = v.text);
      return aval;
    }
    switch (this.typ) {
      case "select":
        this.c.val(checkMultiselectValue(value)[0].id);
        break;
      case "select2":
        this.c.val(checkMultiselectValue(value).map(v => v.id));
        this.c.trigger('change');
        break;
      default:
        this.c.val(value);
        break;
    }
    if (this.cc != null) this.cc.updateView();
    return this;
  }
  /**
   * Determines if the control is visible.
   * @returns {boolean} True if visible.
   */
  isVisible() {
    return this.c.parent().css('display') !== 'none' &&
      !this.c.is(':hidden') &&
      this.c.css('visibility') !== 'hidden' &&
      this.c.css('opacity') > 0;
  }
  /**
   * Sets the control's visibility.
   * @param {boolean} isVisible - True to show.
   * @param {boolean} isMandatory - If required, validation is applied.
   * @returns {this} For chaining.
   */
  setVisible(isVisible, isMandatory) {
    const g = this.c.parent().parent();
    this.setRequired(isMandatory);
    isVisible ? g.show() : g.hide();
    return this;
  }
  /**
   * Converts the field into a select2 control.
   * @param {*} options - Options for select2.
   * @returns {this} For chaining.
   */
  select2(options) {
    const config = { width: '100%', allowClear: true, placeholder: { id: null, name: "Select one" } };
    $.extend(true, config, options);
    if (this.c.is(':not(select)')) throw "Only HTML SELECT elements can be converted to select2.";
    $.getScript("/select2.js", () => {
      if (!$("link[href='/select2.css']").length)
        $('head').append('<link rel="stylesheet" type="text/css" href="/select2.css">');
      this.c.select2(config);
    });
    return this;
  }
  /**
   * Sets the active state.
   * @param {boolean} isActive - True if active.
   * @returns {this} For chaining.
   */
  setActive(isActive) {
    this.c.toggleClass('disabled-pointer-events', !isActive);
    return this;
  }
  /**
   * Enables or disables the field.
   * @param {boolean} isDisabled - True to disable.
   * @returns {this} For chaining.
   */
  setDisable(isDisabled) {
    this.c.prop('disabled', isDisabled);
    return this;
  }
  /**
   * Sets the field as required.
   * @param {boolean} isRequired - True if required.
   * @param {Function} [customFunction] - Optional additional validation.
   * @param {string} [customMessage] - Optional error message.
   * @returns {this} For chaining.
   */
  setRequired(isRequired, customFunction, customMessage) {
    const g = this.c.parent().siblings(".table-info");
    if (isRequired || customFunction)
      Xrm.Portal.Utility.Validation.setValidation(g, this, isRequired, this.vg, customFunction, customMessage);
    else
      Xrm.Portal.Utility.Validation.removeValidation(g, this);
    return this;
  }
  /**
   * Attaches an OnChange event.
   * @param {Function} callback - The event handler.
   * @param {boolean} [triggerOnLoad] - Whether to trigger initially.
   * @returns {this} For chaining.
   */
  attachOnChange(callback, triggerOnLoad) {
    Xrm.Portal.Utility.Event.attachOnChange(this.c, callback, triggerOnLoad);
    return this;
  }
  /**
   * Removes the OnChange event.
   * @returns {this} For chaining.
   */
  removeOnChange() {
    Xrm.Portal.Utility.Event.removeOnChange(this.c);
    return this;
  }
  /**
   * Transforms field to a canvas element for drawing.
   * @returns {void}
   */
  transformToCanvas() {
    this.c.hide();
    if (this.c.parent().children().last()[0].tagName !== "CANVAS") {
      const canvasId = this.id + "Canvas";
      this.c.parent().append("<canvas id='" + canvasId + "'></canvas>");
      Xrm.Portal.Control.Canvas(this.id);
    }
  }
}

/**
 * @class TabControl
 * @extends GenericControl
 * Represents a tab control.
 */
class TabControl extends GenericControl {
  constructor(c) {
    super(c);
  }
  /**
   * Not implemented.
   * @throws {Error} Always throws.
   */
  getValue() { throw "TabControl: getValue not applicable"; }
  /**
   * Not implemented.
   * @throws {Error} Always throws.
   */
  setValue(value) { throw "TabControl: setValue not applicable"; }
  /**
   * Sets tab visibility along with its title.
   * @param {boolean} isVisible
   * @param {boolean} isMandatory
   * @returns {this}
   */
  setVisible(isVisible, isMandatory) {
    const h = this.c.prev();
    if (isVisible) {
      this.c.show();
      if (h.is('h2')) h.show();
    } else {
      this.c.hide();
      if (h.is('h2')) h.hide();
    }
    return this;
  }
}

/**
 * @class SectionControl
 * @extends GenericControl
 * Represents a section control.
 */
class SectionControl extends GenericControl {
  constructor(c) {
    super(c);
  }
  getValue() { throw "SectionControl: getValue not applicable"; }
  setValue(value) { throw "SectionControl: setValue not applicable"; }
  /**
   * Sets section visibility.
   * @param {boolean} isVisible
   * @param {boolean} isMandatory
   * @returns {this}
   */
  setVisible(isVisible, isMandatory) {
    const g = this.c;
    isVisible ? g.parent().show() : g.parent().hide();
    return this;
  }
}

/**
 * @class NotesControl
 * @extends GenericControl
 * Represents a notes control.
 */
class NotesControl extends GenericControl {
  constructor(c) {
    super(c);
    this.cc = document.getElementById(this.id + '_cc');
  }
  getValue() { throw "NotesControl: getValue not implemented"; }
  setValue(value) { throw "NotesControl: setValue not implemented"; }
  /**
   * Gets the count of attachments.
   * @returns {number}
   */
  getNumberofAttachments() {
    return this.c.find('.notes').children().length;
  }
  /**
   * Checks if attachments exist.
   * @returns {boolean}
   */
  hasAttachments() {
    return this.c.find('.notes-empty').css('display') !== 'block';
  }
  getCurrentPage() { throw "NotesControl: getCurrentPage not implemented"; }
  /**
   * Sets visibility for notes.
   * @param {boolean} isVisible
   * @param {boolean} isMandatory
   * @returns {this}
   */
  setVisible(isVisible, isMandatory) {
    const g = this.c.parent().parent();
    isVisible ? g.show() : g.hide();
    return this;
  }
  setActive(isActive) {
    this.c.toggleClass('disabled-pointer-events', !isActive);
    return this;
  }
  setRequired(isRequired, customFunction, customMessage) {
    throw "NotesControl: setRequired not implemented";
  }
}

/**
 * @class SubgridControl
 * @extends GenericControl
 * Represents a subgrid control.
 */
class SubgridControl extends GenericControl {
  constructor(c) {
    super(c);
    this.cc = document.getElementById(this.id + '_cc');
  }
  getValue() { throw "SubgridControl: getValue not implemented"; }
  setValue(value) { throw "SubgridControl: setValue not implemented"; }
  /**
   * Gets the row count on the current page.
   * @returns {number}
   */
  getRowCountFromCurrentPage() {
    return this.c.find('div > div.view-grid > table > tbody > tr').length;
  }
  getCurrentPage() { throw "SubgridControl: getCurrentPage not implemented"; }
  /**
   * Sets subgrid visibility.
   * @param {boolean} isVisible
   * @param {boolean} isMandatory
   * @returns {this}
   */
  setVisible(isVisible, isMandatory) {
    const g = this.c.parent().parent();
    this.setRequired(isMandatory);
    isVisible ? g.show() : g.hide();
    return this;
  }
  /**
   * Controls the create button visibility.
   * @param {boolean} isVisible
   * @returns {this}
   */
  setCreateVisible(isVisible) {
    this.c.find('a[title=Create]').css('display', isVisible ? '' : 'none');
    return this;
  }
  /**
   * Sets required state.
   * @param {boolean} isRequired
   * @param {Function} [customFunction]
   * @param {string} [customMessage]
   * @returns {this}
   */
  setRequired(isRequired, customFunction, customMessage) {
    const g = this.c.parent().siblings(".table-info");
    if (isRequired || customFunction)
      Xrm.Portal.Utility.Validation.setValidation(g, this, isRequired, this.vg, customFunction, customMessage);
    else
      Xrm.Portal.Utility.Validation.removeValidation(g, this);
    return this;
  }
  attachOnChange(callback) {
    Xrm.Portal.Utility.Event.attachOnLoaded(this.c, callback);
    return this;
  }
  /**
   * Shows actions as links in the subgrid.
   * @returns {this}
   */
  showActionsAsLinks() {
    this.c.find(".entity-grid.subgrid").on("loaded", function () {
      $(this).children(".view-grid").find("tr[data-id]")
        .each(function (i, e) {
          let $tdActions = $(this).children("td:last"),
            id = $(this).attr("data-id");
          $tdActions.find(".dropdown.action").hide();
          $tdActions.find(".dropdown.action > ul > li > a").addClass("btn,btn-info").appendTo($tdActions);
        });
    }).trigger("loaded");
    return this;
  }
}

/**
 * @class QuickViewControl
 * @extends GenericControl
 * Represents a quick view control.
 */
class QuickViewControl extends GenericControl {
  constructor(c) {
    super(c);
    this.cc = document.getElementById(this.id + '_cc');
  }
  getValue() {
    const values = this.c.contents().find('.form-control');
    const allowFormats = ['DD/MM/YYYY', 'YYYY/MM/DD'];
    const data = {};
    let aName = '';
    for (let i = 0; i < values.length; i++) {
      aName = values[i].id;
      if ($(values[i]).prop('className').indexOf('lookup') > -1) {
        aName = aName.substr(0, aName.lastIndexOf('_name'));
        data[aName] = values[i].value;
      } else if ($(values[i]).prop('id').indexOf('_datepicker_description') > -1 ||
        $(values[i]).prop('className').indexOf('datetime') > -1) {
        aName = aName.replace('_datepicker_description', '');
        data[aName] = "";
        if (values[i].value) {
          data[aName] = moment(values[i].value, allowFormats).toDate().toString('dd/MM/yyyy');
        }
      } else if ($(values[i]).prop('className').indexOf('picklist') > -1) {
        data[aName + "_text"] = $(values[i]).find('option:selected').text();
        data[aName] = $(values[i]).find('option:selected').val();
      } else {
        data[aName] = values[i].value;
      }
    }
    return data;
  }
  setValue(value) { throw "QuickViewControl: setValue not implemented"; }
  /**
   * Sets quick view visibility.
   * @param {boolean} isVisible
   * @param {boolean} isMandatory
   * @returns {this}
   */
  setVisible(isVisible, isMandatory) {
    const g = this.c.parent().parent();
    isVisible ? g.show() : g.hide();
    return this;
  }
  setDisable(isDisabled) { throw "QuickViewControl: setDisable not implemented"; }
  setRequired(isRequired, customFunction, customMessage) { throw "QuickViewControl: setRequired not implemented"; }
  attachOnChange(callback) {
    Xrm.Portal.Utility.Event.attachOnLoad(this.c, callback);
    return this;
  }
  /**
   * Renders an Adaptive Card.
   * @param {string} attribute - The target field.
   * @param {object} card - The card template.
   * @param {object} data - Data for the template.
   * @returns {HTMLElement} The rendered card.
   */
  renderAdaptiveCard(attribute, card, data) {
    Xrm.Portal.Form.get(attribute).cL.parent().next().next().remove();
    if (Xrm.Portal.Form.get(attribute).getValue().id != "") {
      const parsedCard = Xrm.Portal.Utility.AdaptiveCard.parseTemplate(card, data);
      const adaptiveCard = new AdaptiveCards.AdaptiveCard();
      adaptiveCard.hostConfig = new AdaptiveCards.HostConfig({
        fontFamily: "Segoe UI, Helvetica Neue, sans-serif"
      });
      adaptiveCard.parse(parsedCard);
      const renderedCard = adaptiveCard.render();
      Xrm.Portal.Form.get(attribute).cL.parent().parent().append(renderedCard);
      return renderedCard;
    }
  }
}

/**
 * @class LookupControl
 * @extends GenericControl
 * Represents a lookup control.
 */
class LookupControl extends GenericControl {
  constructor(c) {
    super(c);
    this.cL = c;
    this.cN = this.s.getLookupName(this.id);
    this.cE = this.s.getLookupEntity(this.id);
  }
  enableOneClick() {
    this.cN.on('click', () => this.cL.siblings('div.input-group-btn').children('button.launchentitylookup').click());
    return this;
  }
  getValue() { return { id: this.cL.val(), name: this.cN.val(), logicalname: this.cE.val() }; }
  setValue(value, name, logicalName) {
    if (value && value.id && value.name && value.logicalname) {
      this.cL.val(value.id);
      this.cN.val(value.name);
      this.cE.val(value.logicalname);
    } else {
      this.cL.val(value);
      this.cN.val(name);
      this.cE.val(logicalName);
    }
    if (this.cL.val() !== '') {
      let m = this.cN.nextAll('div.text-muted').first();
      if (m.length) m.hide();
    }
    return this;
  }
  setVisible(isVisible, isMandatory) {
    this.setRequired(isMandatory);
    const g = this.cL.parent().parent().parent();
    isVisible ? g.show() : g.hide();
    return this;
  }
  setActive(isActive) {
    this.c.toggleClass('disabled-pointer-events', !isActive);
    return this;
  }
  setDisable(isDisabled) {
    this.cN.prop('disabled', isDisabled);
    this.cN.siblings('div.input-group-btn').toggle(!isDisabled);
    return this;
  }
  setRequired(isRequired, customFunction, customMessage) {
    const g = this.cL.parent().parent().siblings(".table-info");
    if (isRequired || customFunction)
      Xrm.Portal.Utility.Validation.setValidation(g, this, isRequired, this.vg, customFunction, customMessage);
    else
      Xrm.Portal.Utility.Validation.removeValidation(g, this);
    return this;
  }
  attachOnChange(callback, triggerOnLoad) {
    Xrm.Portal.Utility.Event.attachOnChange(this.cL, callback, triggerOnLoad);
    return this;
  }
}

/**
 * @class CheckboxControl
 * @extends GenericControl
 * Represents a checkbox control.
 */
class CheckboxControl extends GenericControl {
  constructor(c) {
    super(c);
  }
  getValue() { return this.c.prop("checked"); }
  setValue(value) {
    this.c.prop("checked", value);
    return this;
  }
  setVisible(isVisible, isMandatory) {
    const g = this.c.parent().parent().parent();
    this.setRequired(isMandatory);
    isVisible ? g.show() : g.hide();
    return this;
  }
}

/**
 * @class RadioControl
 * @extends GenericControl
 * Represents a radio button control.
 */
class RadioControl extends GenericControl {
  constructor(c) {
    super(c);
  }
  /// <summary>
  /// Sorts the radio buttons in the form.
  /// </summary>
  /// <param name="sortFn" type="Function">The sorting function to use.</param>
  /// <returns type="Object">The current instance for chaining.</returns>
  /// <example>
  /// Xrm.Portal.Form.get("radio").sort(function(a, b) {
  ///   return $(a).val() > $(b).val() ? 1 : -1;
  /// });
  /// </example>  
  sort(sortFn = Xrm.Portal.SortFunctions_Radio.label, sortOrd = Xrm.Portal.SortOrder.Ascending) {
    if (this.c.children('span.radio_item_wrapper').length === 0) {
      this.c.children('input').each((i, inp) => {
        const $i = $(`#${inp.id}`),
          $il = $i.add($(`label[for=${inp.id}]`)),
          groupname = `radio_item_wrapper_${$i.val()}`;
        $il.wrapAll(`<span class='radio_item_wrapper' id='${groupname}'/>`);
      });
    }
    const listItems = this.c.children('span.radio_item_wrapper').get();
    listItems.sort(sortFn);
    if (sortOrd === Xrm.Portal.SortOrder.Descending) listItems.reverse();
    this.c.empty().append(listItems);
    return this;
  }
  getValue() { return this.c.find("input:checked").val(); }
  setValue(value) {
    if (value != null)
      this.c.find("input[value*=" + value + "]").prop("checked", value);
    else
      this.c.find('input[type=radio]').prop('checked', false);
    return this;
  }
  setVisible(isVisible, isMandatory) {
    const g = this.c.parent().parent();
    this.setRequired(isMandatory);
    isVisible ? g.show() : g.hide();
    return this;
  }
  setDisable(isDisabled) {
    this.c.find('input[type=radio]').prop("disabled", isDisabled);
    return this;
  }
}

/**
 * @class DatetimePickerControl
 * @extends GenericControl
 * Represents a datetime picker control.
 */
class DatetimePickerControl extends GenericControl {
  constructor(c) {
    super(c);
  }
  getValue() { return this.c.val(); }
  getData() { return this.c.next().data('DateTimePicker'); }
}

/**
 * @class MultiselectControl
 * @extends GenericControl
 * Represents a multiselect control.
 */
class MultiselectControl extends GenericControl {
  constructor(c) {
    super(c);
  }
  isOptionSelected(optionValueOrLabel) {
    const currentValue = this.getValue();
    return currentValue.some(existingItem =>
      existingItem.Value === optionValueOrLabel || existingItem.Label.UserLocalizedLabel.Label === optionValueOrLabel
    );
  }
  getValue() {
    try {
      const jsonValue = this.c.val();
      return JSON.parse(jsonValue || "[]");
    } catch (error) {
      console.error("Error parsing Multiselect value as JSON:", error);
      return [];
    }
  }
  setValue(values) {
    try {
      const jsonString = JSON.stringify(values);
      this.c.val(jsonString).trigger("change");
    } catch (error) {
      console.error("Error stringifying Multiselect values:", error);
    }
    return this;
  }
  selectOption(optionValueOrLabel) {
    try {
      const options = this.getOptions();
      const validItem = options.find(opt =>
        opt.Value === optionValueOrLabel || opt.Label.UserLocalizedLabel.Label === optionValueOrLabel
      );
      if (!validItem) {
        console.warn("Invalid optionValueOrLabel. Cannot add to Multiselect:", optionValueOrLabel);
        return this;
      }
      if (!this.isOptionSelected(validItem.Value)) {
        const currentValue = this.getValue();
        currentValue.push(validItem);
        this.setValue(currentValue);
      }
    } catch (error) {
      console.error("Error adding optionValueOrLabel to Multiselect:", error);
    }
    return this;
  }
  unselectOption(optionValueOrLabel) {
    try {
      const options = this.getOptions();
      const validItem = options.find(opt =>
        opt.Value === optionValueOrLabel || opt.Label.UserLocalizedLabel.Label === optionValueOrLabel
      );
      if (!validItem) {
        console.warn("Invalid optionValueOrLabel. Cannot remove from Multiselect:", optionValueOrLabel);
        return this;
      }
      if (this.isOptionSelected(validItem.Value)) {
        const currentValue = this.getValue();
        const updatedValue = currentValue.filter(existingItem =>
          existingItem.Value !== validItem.Value
        );
        this.setValue(updatedValue);
      }
    } catch (error) {
      console.error("Error removing optionValueOrLabel from Multiselect:", error);
    }
    return this;
  }
  getOptions() {
    try {
      const options = JSON.parse(
        this.c.closest('.control').find('[pcf-controlcontext]').attr("pcf-controlcontext")
      ).ControlProperties.value_Options;
      return options || [];
    } catch (error) {
      console.error("Error retrieving options for Multiselect:", error);
      return [];
    }
  }
  setVisible(isVisible, isMandatory) {
    const g = this.c.parent().parent();
    this.setRequired(isMandatory);
    isVisible ? g.show() : g.hide();
    return this;
  }
}

// #endregion New Control Classes
//#region Xrm Class
var Xrm = Xrm || {};

Xrm.Portal = {
  version: "ai.0.0.6",
  // User: {
  //     getAsync: async function() {
  //         var t = await Xrm.Portal.Utility.Auth.get();
  //         return (Xrm.Portal.Utility.Auth.decode(t));
  //     }
  // },
  Utility: {
    Auth: {
      /*authorize: function() {
      },*/
      decode: function (token) {
        if (token !== "") {
          var base64Url = token.split('.')[1];
          var base64 = decodeURIComponent(atob(base64Url).split('').map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
          }).join(''));

          return JSON.parse(base64);
        }
        throw "No login user is detected.";
      },
      get: function () {
        return $.get("/_services/auth/token");
      }
    },
    hasPage_Validators: function () {
      return typeof (Page_Validators) !== typeof (undefined);
    },
    Selector: {
      prependSelector: function (id) {
        return "#" + id;
      },
      appendSelector: function (id) {
        return this.prependSelector(id);
      },
      appendLabel: function (id) {
        return id + "_label";
      },
      getByControlId: function (id) {
        return $(this.prependSelector(id));
      },
      getByCSSSelector: function (cssSelector) {
        return $(cssSelector);
      },
      getTextLabel: function (id) {
        return $(this.prependSelector(id) + "_label");
      },
      getLookupName: function (id) {
        return $(this.prependSelector(id) + "_name");
      },
      getLookupEntity: function (id) {
        return $(this.prependSelector(id) + "_entityname");
      },
      getByDataName: function (id) {
        return $("[data-name=" + id + "]");
      }
    },
    Validation: {
      postFix: "Xrm_Client_Validation",
      //Note: adding skipPrefixLabel: true will skip the prefix label in the error message and only show the message
      validators:
      {
        "min2": {
          callback: (field) => field.getValue()?.trim().length >= 2,
          message: 'must be at least 2 characters long.'
        },
        "commonchars": {
          callback: (field) => /^[a-zA-Z0-9.,'"\s-]*$/.test(field.getValue()?.trim()),
          message: 'can only contain letters, numbers, spaces, and common punctuation.'
        },
        "d11": {
          //empty or 11 digits
          callback: (field) => /^\d{11}$/.test(field.getValue()?.trim()),
          message: 'must be 11 digits.'
        },
        "d9": {
          callback: (field) => /^\d{9}$/.test(field.getValue()?.trim()),
          message: 'must be 9 digits.'
        },
        "email": {
          callback: (field) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.getValue()?.trim()),
          message: 'must be a valid email address.'
        },
        "phone": {
          callback: (field) => /^\d{10}$/.test(field.getValue()?.trim()),
          message: 'must be 10 digits.'
        },
        "postalcode": {
          callback: (field) => /^\d{4}$/.test(field.getValue()?.trim()),
          message: 'must be 4 digits.'
        },
        "number": {
          callback: (field) => /^\d+$/.test(field.getValue()?.trim()),
          message: 'must be a number.'
        }
      },
      required: function (control) {
        //console.log("Validation.required -> id: " + control);
        var value = control.getValue();
        value = typeof value === 'string' ? value.trim() : value;
        if (value == null || value == "" || (value.hasOwnProperty("id") && (value.id == "" || value.id == null))) {
          return false;
        } else {
          return true;
        }
      },
      removeValidation: function (groupObj, control, customPostFix = "") {
        $(groupObj).attr("class", "table-info");
        var l = Xrm.Portal.Utility.Selector.appendLabel(control.id);
        var vid = [l, this.postFix, customPostFix].filter(Boolean).join('_');
        if (Xrm.Portal.Utility.hasPage_Validators()) {
          Page_Validators = $.grep(Page_Validators,
            function (e) {
              return $(e).prop('controltovalidate') != "" && $(e).prop('id') != vid;
            }
          );
        }
      },
      setValidation: function (groupObj, control, isRequired, validationGroup, validationFunction, customMessage, customPostFix = "") {
        var id = control.id;
        var l = Xrm.Portal.Utility.Selector.appendLabel(id);
        var vid = [l, this.postFix, customPostFix].filter(Boolean).join('_');
        var g = groupObj;
        var c = Xrm.Portal.Utility.Selector.getByControlId(id);
        if (c.length > 0) {
          isRequired && $(g).attr("class", "table-info required");
          if (Xrm.Portal.Utility.hasPage_Validators()) {
            Page_Validators = $.grep(Page_Validators,
              function (e) {
                return $(e).prop('controltovalidate') != "" && $(e).prop('id') != vid;
              }
            );

            validationGroup = (validationGroup == null || validationGroup == "")
              && Page_Validators.length > 0 ? Page_Validators[0].validationGroup : validationGroup;

            var vF = validationFunction == null && isRequired ? function () {
              return Xrm.Portal.Utility.Validation.required(control)
            } : validationFunction;

            //retrive lable if there is no custom message
            var m = customMessage == null ? $(g).children("label").html() + " is a required field." : customMessage;
            // Create new validator
            var nv = document.createElement('span');
            nv.style.display = "none";
            nv.id = vid;
            nv.controltovalidate = id;
            nv.errormessage = "<a href='#" + l + "'>" + m + "</a>";
            nv.validationGroup = validationGroup;
            nv.initialvalue = "";
            nv.evaluationfunction = vF;
            // Add the new validator to the page validators array:
            Page_Validators.push(nv);

            // Wire-up the click event handler of the validation summary link
            $("a[href='#" + l + "']").on("click", function () {
              scrollToAndFocus("'" + l + "'", "'" + id + "'");
            });
          }
        }
      },
    },
    Event: {
      wireUp: function (events) {
        console.log("Event.wireUp -> events: " + events);
        for (var i in events) {
          var e = events[i];
          if (e.hasOwnProperty("t") && e.hasOwnProperty("f")) {
            console.log("Event wireup -> c: " + e.c + ", t: " + e.t + ", f: " + e.f);
            var c = Xrm.Portal.Utility.Selector.getByControlId(e.c); //CHECK
            switch (e.t) {
              case Xrm.Portal.EventType.OnChange:
                this.attachOnChange(c, e.f);
                break;
              case Xrm.Portal.EventType.OnClick:
                alert("OnClick is not implemented");
                break;
              default:
                break;
            }
          }
        }
      },
      attachOnLoaded: function (control, callback) {
        control.on('loaded', callback);
      },
      attachOnLoad: function (control, callback) {
        control.on('load', callback);
      },
      attachOnChange: function (control, callback, triggerOnLoad) {
        if (control.is("select[multiple]")) {
          // Handle multiselect fields
          control.on("change", function () {
            const selectedValues = control.val(); // Get selected values
            callback(selectedValues); // Pass selected values to the callback
          });
        } else {
          // Existing behavior for other controls
          control.change(callback);
          if (triggerOnLoad != false)
            control.trigger('change');
        }
      },
      attachDateTimePickerOnChange: function (control, callback) {
        control.next().datetimepicker().on('dp.change', callback);
      },
      removeOnChange: function (control) {
        control.off('change');
      }
    },
    AdaptiveCard: {
      parseTemplate: function (card, data) {
        var str = JSON.stringify(card);
        var matches = str.match(/(\\)?"\$\{.+?\}(\\)?"/gm)
        if (matches != null) {
          for (var m = 0; m < matches.length; m++) {
            var r = matches[m].match(/[^"${]*(?=})/s);
            if (r != null && r.length > 0) {
              str = str.replace(matches[m], '"' + data[r[0]].replaceAll('"', '\\"') + '"');
            }
          }
          matches = str.match(/("(false|true)(.+)\\""(?=,))|("(false|true)(.+)\\""(?=}))/gm);
          if (matches != null)
            for (var i = 0; i < matches.length; i++) {
              str = str.replace(matches[i], '"' + eval(eval(matches[i])) + '"');
            }
        }
        return JSON.parse(str);
      }
    }
  },
  Ui: {
    get: function (id) {
      var c = Xrm.Portal.Utility.Selector.getByDataName(id);
      var ct = this.getControlType(c);
    },
    getControlType: function (c) {
      //console.log("getControlType -> c: " + c);
      if (c.length > 0) {
        if (c.attr("class").startsWith("tab")) {
          return this.controlType.Tab;
        } else if (c.attr("class").startsWith("section")) {
          return this.controlType.Section;
        }
      }
    },
    controlType: {
      Tab: 1,
      Section: 2
    }
  },
  Grid: {
    get: function (cssSelector = ".entitylist") {
      this.c = Xrm.Portal.Utility.Selector.getByCSSSelector(cssSelector);
      this.ct = this.getControlType(this.c);
      return this;
    },
    getControlType: function (c) {
      //console.log("getControlType -> c: " + c);
      if (c.length > 0) {
        if (c.prop('className') == 'entitylist') {
          return this.controlType.Grid;
        }
      }
    },
    showActionsAsLinks: function () {
      if (!this.c) this.get();
      this.c.find(".entity-grid").on("loaded", function () {
        $(this).children(".view-grid").find("tr[data-id]")
          .each(function (i, e) {
            let $tdActions = $(this).children("td:last"),
              id = $(this).attr("data-id");
            $tdActions.find(".dropdown.action > ul > li > a").appendTo($tdActions);
            $tdActions.find(".dropdown.action").hide();
          });
      }).trigger("loaded");
    },
    controlType: {
      Grid: 1
    }
  },
  WebForm: {
    isExisted: function () {
      return $('#WebFormPanel').children('.form-readonly').length > 0;
    },
    isReadOnly: function () {
      return Xrm.Portal.WebForm.isExisted() && $('#WebFormPanel').children('.form-readonly').length > 0;
    }
  },
  Form: {
    Validation: {
      assertRegex: function (cid, exp, message, isRequired) {
        Xrm.Portal.Form.get(cid).setRequired(isRequired, function () {
          if (!isRequired && Xrm.Portal.Form.get(cid).getValue() == "") return true;
          else return exp.test(Xrm.Portal.Form.get(cid).getValue());
        }, message);
      },
      denyPastDate: function (cid, message, isRequired) {
        Xrm.Portal.Form.get(cid).setRequired(isRequired, function () {
          if (!isRequired && Xrm.Portal.Form.get(cid).getValue() == "") return true;
          else return new Date() <= new Date(Xrm.Portal.Form.get(cid).getValue());
        }, message);
      },
      denyFutureDate: function (cid, message, isRequired) {
        Xrm.Portal.Form.get(cid).setRequired(isRequired, function () {
          if (!isRequired && Xrm.Portal.Form.get(cid).getValue() == "") return true;
          else return new Date() >= new Date(Xrm.Portal.Form.get(cid).getValue());
        }, message);
      },
      compareDates: function (mainid, subid, message, isRequired) {
        Xrm.Portal.Form.get(mainid).setRequired(isRequired, function () {
          if (!isRequired && Xrm.Portal.Form.get(mainid).getValue() == "") return true;
          else return new Date(Xrm.Portal.Form.get(mainid).getValue()) > new Date(Xrm.Portal.Form.get(subid).getValue())
        }, message);
      },
      setNumberRange: function (cid, min, max, message, isRequired) {
        Xrm.Portal.Form.get(cid).setRequired(isRequired, function () {
          var isMin = true,
            isMax = true;
          if (min != undefined) {
            isMin = Xrm.Portal.Form.get(cid).getValue() >= min;
          }
          if (max != undefined) {
            isMax = Xrm.Portal.Form.get(cid).getValue() <= max;
          }
          if (!isRequired && Xrm.Portal.Form.get(cid).getValue() == "") return true;
          else return isMin && isMax;
        }, message);
      }
    },
    get: function (id) {
      var c = Xrm.Portal.Utility.Selector.getByControlId(id);
      var ct, v;

      if (c != undefined && c.length > 0) {
        ct = this.getControlType(c);
      } else {
        c = Xrm.Portal.Utility.Selector.getByDataName(id);
        if (c != undefined && c.length > 0) {
          ct = this.getUiControlType(c);
        } else console.warn("Control not found: " + id);
      }

      switch (ct) {
        case this.controlType.DatetimePicker:
          v = new Xrm.Portal.Control.DatetimePicker(c);
          break;
        case this.controlType.Radio:
          v = new Xrm.Portal.Control.Radio(c);
          break;
        case this.controlType.Checkbox:
          v = new Xrm.Portal.Control.Checkbox(c);
          break;
        case this.controlType.Lookup:
          v = new Xrm.Portal.Control.Lookup(c);
          break;
        case this.controlType.Multiselect:
          v = new Xrm.Portal.Control.Multiselect(c);
          break;
        case this.controlType.Tab:
          v = new Xrm.Portal.Control.Tab(c);
          break;
        case this.controlType.Section:
          v = new Xrm.Portal.Control.Section(c);
          break;
        case this.controlType.Subgrid:
          v = new Xrm.Portal.Control.Subgrid(c);
          break;
        case this.controlType.QuickView:
          v = new Xrm.Portal.Control.QuickView(c);
          break;
        case this.controlType.Notes:
          v = new Xrm.Portal.Control.Notes(c);
          break;
        default:
          v = new Xrm.Portal.Control.Generic(c);
          break;
      }
      return v;
    },
    getUiControlType: function (c) {
      //console.log("getUiControlType: -> c: " + c);
      if (c.length > 0) {
        if (c.attr("class").startsWith("tab")) {
          return this.controlType.Tab;
        } else if (c.attr("class").startsWith("section")) {
          return this.controlType.Section;
        }
      }
    },
    getControlType: function (c) {
      //console.log("getControlType -> c: " + c);
      var ret = this.controlType.Control;
      if (c.length > 0) {
        if (c.attr("data-ui") == "datetimepicker") {
          ret = this.controlType.DatetimePicker;
        } else if (c.attr("type") == "checkbox") {
          ret = this.controlType.Checkbox;
        } else if (c.attr("type") == "hidden") {
          if ($(`div.control:has(#PcfControlConfig_${c.attr("id")})`).length > 0) {
            //} else if ($(`div.control:has(#${c.attr("id")}):has(.MscrmControls.MultiSelectPicklist.UpdMSPicklistControl)`).length > 0) {
            ret = this.controlType.Multiselect;
          } else
            ret = this.controlType.Lookup;
        } else if (c.attr("class") != null && (c.attr("class").indexOf("boolean-radio") >= 0 || c.attr("class").indexOf("picklist horizontal") >= 0 || c.attr("class").indexOf("picklist vertical") >= 0)) {
          ret = this.controlType.Radio;
        } else if (c.prop('className') == 'entitylist') {
          ret = this.controlType.Grid;
        } else if (c.prop('className') == 'subgrid') {
          ret = this.controlType.Subgrid;
        } else if (c.is('iframe')) {
          ret = this.controlType.QuickView;
          //} else if (c.is("select[multiple]")) {
        } else if (c.children('.entity-notes').length > 0) {
          ret = this.controlType.Notes;
        } else {
          ret = this.controlType.Control;
        }
      }
      return ret;
    },
    controlType: {
      Control: 1,
      Lookup: 2,
      DatetimePicker: 3,
      Radio: 4,
      Checkbox: 5,
      Dropdown: 6,
      Multiselect: 7,
      Tab: 100,
      Section: 101,
      Subgrid: 1000,
      QuickView: 2000,
      Notes: 3000
    }
  },
  Control: {
    Tab: TabControl,
    Section: SectionControl,
    Notes: NotesControl,
    Subgrid: SubgridControl,
    QuickView: QuickViewControl,
    Generic: GenericControl,
    Lookup: LookupControl,
    Checkbox: CheckboxControl,
    Radio: RadioControl,
    DatetimePicker: DatetimePickerControl,
    Multiselect: MultiselectControl,
    Canvas: CanvasControl
  },
  SortFunctions_Radio: {
    "label": function (a, b) {
      function getLabel(a) {
        return $(a).find("label").clone()    //clone the element
          .children() //select all the children
          .remove()   //remove all the children
          .end()  //again go back to selected element
          .text();
      }

      var A = getLabel(a).toUpperCase(),
        B = getLabel(b).toUpperCase();
      return A.localeCompare(B);
    },
    "value": function (a, b) {
      throw "not implemented, to be tested";
      var A = $(a).val().toUpperCase(),
        B = $(b).val().toUpperCase();
      return A.localeCompare(B);
    }
  },
  SortOrder: {
    Asc: true,
    Desc: false,
    Ascending: true,
    Descending: false
  },
  EventType: {
    OnChange: 1,
    OnClick: 2
  },
  Bools: {
    Yes: true,
    No: false,
    Active: true,
    Inactive: false,
    "TRUE": true,
    "FALSE": false,
    1: true,
    0: false
  },
  /**
   * Logs all interactive controls within #EntityFormView grouped by their type in an interactive format.
   * 
   * Why:
   * - To provide developers with an organized and interactive view of controls for debugging or customization.
   * 
   * What:
   * - Identifies controls (e.g., inputs, videos, etc.) within #EntityFormView, excluding those with IDs starting with "EntityFormView_".
   * - Groups controls by their type and logs them as an object for easy exploration in the console.
   * 
   * How:
   * - Uses jQuery to find and filter controls.
   * - Groups controls by their type using `reduce`.
   * - Logs the grouped controls directly as an object for interactive inspection in the console.
   */
  codeSampleInConsole: function () {
    const controls = [];
    // Dynamically select all interactive elements within #EntityFormView, excluding those with id starting with EntityFormView_ and buttons
    $("#EntityFormView div.control")
      .find(":input, audio, video, progress, meter, [contenteditable='true'], [tabindex]")
      .not("[id^='EntityFormView_'], button")
      .each(function () {
        const fieldId = $(this).attr("id") || "Unknown"; // Use id attribute
        const escapedFieldId = CSS.escape(fieldId); // Escape special characters
        const label = Xrm.Portal.Utility.Selector.getTextLabel(escapedFieldId).text().trim() || "No Label";
        const control = Xrm.Portal.Form.get(fieldId);
        const controlType = control ? control.constructor.name : this.tagName.toLowerCase();
        const inputType = $(this).attr("type") || $(this).attr("role") || "N/A"; // Detect type or role

        controls.push({
          SchemaName: fieldId,
          Label: label,
          Type: controlType,
          InputType: inputType, // Include input type or role for better clarity
          CodeSample: `Xrm.Portal.Form.get('${fieldId}')`
        });
      });

    // Group controls by type
    const groupedControls = controls.reduce((acc, control) => {
      if (!acc[control.Type]) {
        acc[control.Type] = [];
      }
      acc[control.Type].push(control);
      return acc;
    }, {});

    // Log grouped controls as an object for interactive inspection
    console.debug(groupedControls);
  }
}
//#endregion
console.debug("Xrm.Portal loaded", Xrm.Portal.version);
