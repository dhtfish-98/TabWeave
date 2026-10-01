let cachedDescriptions = null;
function actionDescriptions() {
  if (cachedDescriptions) return cachedDescriptions;
  cachedDescriptions = [{
    name: 'status',
    description: 'Get browser status',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  }, {
    name: 'get_config',
    description: 'Get configuration',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  }, {
    name: 'set_config',
    description: 'Setup configuration',
    inputSchema: {
      type: 'object',
      properties: {
        fast_timeout: {
          type: 'number'
        },
        default_timeout: {
          type: 'number'
        },
        long_timeout: {
          type: 'number'
        }
      }
    }
  }, {
    name: 'reconnect',
    description: 'Reconnect browser',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  }, {
    name: 'cleanup',
    description: 'Clear cache',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  }, {
    name: 'health_check',
    description: 'Health Check',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  }, {
    name: 'set_debug',
    description: 'Set debug mode',
    inputSchema: {
      type: 'object',
      properties: {
        enabled: {
          type: 'boolean'
        }
      },
      required: ['enabled']
    }
  }, {
    name: 'request_stats',
    description: 'Request statistics',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  }, {
    name: 'navigate',
    description: 'Navigate to URL',
    inputSchema: {
      type: 'object',
      properties: {
        url: {
          type: 'string'
        },
        wait_until: {
          type: 'string',
          enum: ['load', 'domcontentloaded', 'networkidle']
        },
        timeout: {
          type: 'number'
        }
      },
      required: ['url']
    }
  }, {
    name: 'reload',
    description: 'Refresh the page',
    inputSchema: {
      type: 'object',
      properties: {
        timeout: {
          type: 'number'
        }
      }
    }
  }, {
    name: 'go_back',
    description: 'Back',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  }, {
    name: 'go_forward',
    description: 'Forward',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  }, {
    name: 'stop_loading',
    description: 'Stop loading',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  }, {
    name: 'click',
    description: 'Unified click (supports selector/text/coordinates, single/double/triple/right/long, fast/human/smart mode)',
    inputSchema: {
      type: 'object',
      properties: {
        selector: {
          type: 'string',
          description: 'CSS selector'
        },
        text: {
          type: 'string',
          description: 'Find the click target by text'
        },
        x: {
          type: 'number',
          description: 'coordinate X'
        },
        y: {
          type: 'number',
          description: 'coordinate Y'
        },
        mode: {
          type: 'string',
          enum: ['fast', 'human', 'smart'],
          description: 'Click mode'
        },
        type: {
          type: 'string',
          enum: ['single', 'double', 'triple', 'right', 'long'],
          description: 'Click type'
        },
        index: {
          type: 'number',
          description: 'Nth element'
        },
        if_exists: {
          type: 'boolean',
          description: 'Click only when present'
        },
        wait_after: {
          type: 'string',
          enum: ['load', 'networkidle'],
          description: 'Wait after clicking'
        },
        scroll_first: {
          type: 'boolean',
          description: 'Scroll to the element first'
        },
        hover_first: {
          type: 'string',
          description: 'Hover this selector first'
        },
        timeout: {
          type: 'number'
        },
        duration: {
          type: 'number',
          description: 'Long press duration (ms)'
        }
      }
    }
  }, {
    name: 'type',
    description: 'unified input (supports selector/label/placeholder/index, fast/human/slow mode)',
    inputSchema: {
      type: 'object',
      properties: {
        selector: {
          type: 'string'
        },
        label: {
          type: 'string',
          description: 'Find by label'
        },
        placeholder: {
          type: 'string',
          description: 'Search by placeholder'
        },
        index: {
          type: 'number',
          description: 'by index'
        },
        text: {
          type: 'string'
        },
        mode: {
          type: 'string',
          enum: ['fast', 'human', 'slow']
        },
        clear: {
          type: 'boolean'
        },
        press_enter: {
          type: 'boolean'
        },
        if_exists: {
          type: 'boolean'
        },
        delay: {
          type: 'number'
        },
        timeout: {
          type: 'number'
        }
      },
      required: ['text']
    }
  }, {
    name: 'fill',
    description: 'Quick filling (direct replacement)',
    inputSchema: {
      type: 'object',
      properties: {
        selector: {
          type: 'string'
        },
        text: {
          type: 'string'
        },
        timeout: {
          type: 'number'
        }
      },
      required: ['selector', 'text']
    }
  }, {
    name: 'fill_form',
    description: 'Fill out forms in batches',
    inputSchema: {
      type: 'object',
      properties: {
        fields: {
          type: 'object'
        },
        submit: {
          type: 'boolean'
        }
      },
      required: ['fields']
    }
  }, {
    name: 'wait',
    description: 'Unified waiting (supports time/element/disappear/text/URL/loading/network idle/DOM stable/JS conditions)',
    inputSchema: {
      type: 'object',
      properties: {
        ms: {
          type: 'number',
          description: 'wait milliseconds'
        },
        type: {
          type: 'string',
          enum: ['element', 'gone', 'hidden', 'text', 'url', 'load', 'networkidle', 'network_idle', 'domcontentloaded', 'function', 'time']
        },
        selector: {
          type: 'string'
        },
        text: {
          type: 'string'
        },
        pattern: {
          type: 'string',
          description: 'URL match'
        },
        expression: {
          type: 'string',
          description: 'JS expression'
        },
        state: {
          type: 'string',
          enum: ['visible', 'hidden', 'attached', 'detached']
        },
        timeout: {
          type: 'number'
        }
      }
    }
  }, {
    name: 'scroll',
    description: 'unified scrolling (supports top/bottom/element/text/coordinates/relative/direction/loading more)',
    inputSchema: {
      type: 'object',
      properties: {
        to: {
          type: 'string',
          description: 'top/bottom/center or selector'
        },
        text: {
          type: 'string',
          description: 'Scroll to text'
        },
        position: {
          type: 'object',
          properties: {
            x: {
              type: 'number'
            },
            y: {
              type: 'number'
            }
          }
        },
        by: {
          type: 'object',
          properties: {
            x: {
              type: 'number'
            },
            y: {
              type: 'number'
            }
          }
        },
        direction: {
          type: 'string',
          enum: ['up', 'down', 'left', 'right']
        },
        amount: {
          type: 'number'
        },
        within: {
          type: 'string',
          description: 'Scroll within the element'
        },
        load_more: {
          type: 'boolean'
        },
        max_scrolls: {
          type: 'number'
        }
      }
    }
  }, {
    name: 'check',
    description: 'Unified check of element status (exists/visible/hidden/enabled/disabled/checked/focused/editable/in_viewport)',
    inputSchema: {
      type: 'object',
      properties: {
        selector: {
          type: 'string'
        },
        state: {
          type: 'string',
          enum: ['exists', 'visible', 'hidden', 'enabled', 'disabled', 'checked', 'focused', 'editable', 'in_viewport']
        },
        text: {
          type: 'string',
          description: 'Check text exists'
        },
        class_name: {
          type: 'string',
          description: 'Check class name'
        },
        timeout: {
          type: 'number'
        }
      }
    }
  }, {
    name: 'assert',
    description: 'Unified assertion (text/visible/hidden/url/count/element)',
    inputSchema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['text', 'visible', 'hidden', 'url', 'count', 'element']
        },
        selector: {
          type: 'string'
        },
        text: {
          type: 'string'
        },
        pattern: {
          type: 'string'
        },
        expected: {
          type: 'number'
        },
        operator: {
          type: 'string',
          enum: ['==', '>', '>=', '<', '<=', '!=']
        },
        state: {
          type: 'string'
        },
        timeout: {
          type: 'number'
        }
      },
      required: ['type']
    }
  }, {
    name: 'get',
    description: 'Get element information (text/html/attribute/value/position/dimensions/styles/count/classes/tag/dataset)',
    inputSchema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['text', 'html', 'attribute', 'value', 'position', 'dimensions', 'bounding_box', 'styles', 'count', 'classes', 'tag', 'dataset']
        },
        selector: {
          type: 'string'
        },
        attribute: {
          type: 'string'
        },
        properties: {
          type: 'array',
          items: {
            type: 'string'
          }
        },
        outer: {
          type: 'boolean'
        },
        fallback: {
          type: 'string'
        }
      },
      required: ['selector']
    }
  }, {
    name: 'get_page',
    description: 'Get page information (url/title/source/text/viewport)',
    inputSchema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['url', 'title', 'source', 'text', 'viewport']
        }
      }
    }
  }, {
    name: 'new_tab',
    description: 'Open a new tab',
    inputSchema: {
      type: 'object',
      properties: {
        url: {
          type: 'string'
        }
      }
    }
  }, {
    name: 'switch_tab',
    description: 'Switch tabs',
    inputSchema: {
      type: 'object',
      properties: {
        index: {
          type: 'number'
        }
      },
      required: ['index']
    }
  }, {
    name: 'close_tab',
    description: 'Close tab',
    inputSchema: {
      type: 'object',
      properties: {
        index: {
          type: 'number'
        }
      }
    }
  }, {
    name: 'list_tabs',
    description: 'List all tabs',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  }, {
    name: 'enter_frame',
    description: 'Enter iframe',
    inputSchema: {
      type: 'object',
      properties: {
        selector: {
          type: 'string'
        },
        timeout: {
          type: 'number'
        }
      },
      required: ['selector']
    }
  }, {
    name: 'exit_frame',
    description: 'Exit the current iframe',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  }, {
    name: 'exit_all_frames',
    description: 'Exit all iframes',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  }, {
    name: 'list_frames',
    description: 'List all iframes',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  }, {
    name: 'press_key',
    description: 'Button',
    inputSchema: {
      type: 'object',
      properties: {
        key: {
          type: 'string'
        },
        modifiers: {
          type: 'array',
          items: {
            type: 'string'
          }
        }
      },
      required: ['key']
    }
  }, {
    name: 'hotkey',
    description: 'Key combination',
    inputSchema: {
      type: 'object',
      properties: {
        keys: {
          type: 'string'
        }
      },
      required: ['keys']
    }
  }, {
    name: 'mouse',
    description: 'Mouse operation (move/down/up/click)',
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['move', 'down', 'up', 'click']
        },
        x: {
          type: 'number'
        },
        y: {
          type: 'number'
        },
        button: {
          type: 'string',
          enum: ['left', 'right', 'middle']
        },
        steps: {
          type: 'number'
        }
      },
      required: ['action']
    }
  }, {
    name: 'hover',
    description: 'Hover',
    inputSchema: {
      type: 'object',
      properties: {
        selector: {
          type: 'string'
        }
      },
      required: ['selector']
    }
  }, {
    name: 'drag',
    description: 'Drag and drop',
    inputSchema: {
      type: 'object',
      properties: {
        from_selector: {
          type: 'string'
        },
        to_selector: {
          type: 'string'
        },
        from_x: {
          type: 'number'
        },
        from_y: {
          type: 'number'
        },
        to_x: {
          type: 'number'
        },
        to_y: {
          type: 'number'
        },
        offset_x: {
          type: 'number'
        },
        offset_y: {
          type: 'number'
        }
      }
    }
  }, {
    name: 'select',
    description: 'drop-down selection',
    inputSchema: {
      type: 'object',
      properties: {
        selector: {
          type: 'string'
        },
        value: {
          type: 'string'
        },
        index: {
          type: 'number'
        },
        text: {
          type: 'string'
        }
      },
      required: ['selector']
    }
  }, {
    name: 'checkbox',
    description: 'Check box operation',
    inputSchema: {
      type: 'object',
      properties: {
        selector: {
          type: 'string'
        },
        checked: {
          type: 'boolean'
        }
      },
      required: ['selector']
    }
  }, {
    name: 'upload_file',
    description: 'File upload',
    inputSchema: {
      type: 'object',
      properties: {
        selector: {
          type: 'string'
        },
        files: {
          oneOf: [{
            type: 'string'
          }, {
            type: 'array',
            items: {
              type: 'string'
            }
          }]
        }
      },
      required: ['selector', 'files']
    }
  }, {
    name: 'dialog',
    description: 'Dialog processing',
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['accept', 'dismiss']
        },
        text: {
          type: 'string'
        }
      }
    }
  }, {
    name: 'cookies',
    description: 'Cookie operation (get/set/delete/clear)',
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['get', 'set', 'delete', 'clear']
        },
        name: {
          type: 'string'
        },
        value: {
          type: 'string'
        },
        domain: {
          type: 'string'
        },
        path: {
          type: 'string'
        },
        expires: {
          type: 'number'
        },
        httpOnly: {
          type: 'boolean'
        },
        secure: {
          type: 'boolean'
        }
      }
    }
  }, {
    name: 'storage',
    description: 'Storage operation (get/set/remove/clear)',
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['get', 'set', 'remove', 'clear']
        },
        type: {
          type: 'string',
          enum: ['local', 'session']
        },
        key: {
          type: 'string'
        },
        value: {
          type: 'string'
        }
      }
    }
  }, {
    name: 'find',
    description: 'Find elements',
    inputSchema: {
      type: 'object',
      properties: {
        selector: {
          type: 'string'
        },
        text: {
          type: 'string'
        },
        attribute: {
          type: 'string'
        },
        value: {
          type: 'string'
        },
        tag: {
          type: 'string'
        },
        limit: {
          type: 'number'
        }
      }
    }
  }, {
    name: 'screenshot',
    description: 'Screenshot',
    inputSchema: {
      type: 'object',
      properties: {
        path: {
          type: 'string'
        },
        fullPage: {
          type: 'boolean'
        },
        selector: {
          type: 'string'
        }
      }
    }
  }, {
    name: 'eval',
    description: 'Execute JavaScript',
    inputSchema: {
      type: 'object',
      properties: {
        script: {
          type: 'string'
        },
        timeout: {
          type: 'number'
        }
      },
      required: ['script']
    }
  }, {
    name: 'highlight',
    description: 'Highlight elements (debugging)',
    inputSchema: {
      type: 'object',
      properties: {
        selector: {
          type: 'string'
        },
        duration: {
          type: 'number'
        },
        color: {
          type: 'string'
        }
      },
      required: ['selector']
    }
  }, {
    name: 'batch',
    description: 'Batch execution',
    inputSchema: {
      type: 'object',
      properties: {
        actions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              tool: {
                type: 'string'
              },
              args: {
                type: 'object'
              },
              stopOnError: {
                type: 'boolean'
              }
            },
            required: ['tool']
          }
        }
      },
      required: ['actions']
    }
  }, {
    name: 'retry',
    description: 'Automatic retry',
    inputSchema: {
      type: 'object',
      properties: {
        tool: {
          type: 'string'
        },
        args: {
          type: 'object'
        },
        max_retries: {
          type: 'number'
        },
        delay_ms: {
          type: 'number'
        },
        success_check: {
          type: 'string'
        }
      },
      required: ['tool']
    }
  }, {
    name: 'run_steps',
    description: 'Intelligent multi-step execution - execute multiple operation steps in one call, with built-in automatic waiting and error retry. Suitable for multi-step processes such as login and form filling, 10 times faster than step-by-step calls',
    inputSchema: {
      type: 'object',
      properties: {
        steps: {
          type: 'array',
          description: 'Array of operation steps, executed in order',
          items: {
            type: 'object',
            properties: {
              tool: {
                type: 'string',
                description: 'Tool name (click/type/fill/navigate/scroll/wait/eval/screenshot, etc.)'
              },
              args: {
                type: 'object',
                description: 'Tool parameters'
              },
              wait_before: {
                type: 'number',
                description: 'wait ms before step'
              },
              wait_after: {
                type: 'number',
                description: 'wait ms after step'
              },
              optional: {
                type: 'boolean',
                description: 'Whether to continue on failure (default false)'
              },
              timeout: {
                type: 'number',
                description: 'This step times out in ms'
              }
            },
            required: ['tool']
          }
        },
        auto_wait: {
          type: 'boolean',
          description: 'Automatically wait for the element to be ready (default true)'
        },
        retry_on_fail: {
          type: 'boolean',
          description: 'Automatically retry on failure (default true)'
        },
        max_step_retries: {
          type: 'number',
          description: 'Retries after the first attempt, 0 to 10 (default 2)'
        },
        step_timeout: {
          type: 'number',
          description: 'Default timeout ms for each step (default 10000)'
        },
        stop_on_error: {
          type: 'boolean',
          description: 'Stop on error (default true)'
        },
        return_intermediate: {
          type: 'boolean',
          description: 'Returns the intermediate step results (default false)'
        }
      },
      required: ['steps']
    }
  }, {
    name: 'console_logs',
    description: 'Console log',
    inputSchema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number'
        },
        clear: {
          type: 'boolean'
        }
      }
    }
  }, {
    name: 'snapshot',
    description: 'Get the page ARIA snapshot as YAML',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  }, {
    name: 'focus',
    description: 'Focus on elements',
    inputSchema: {
      type: 'object',
      properties: {
        selector: {
          type: 'string'
        }
      },
      required: ['selector']
    }
  }, {
    name: 'blur',
    description: 'Out of focus elements',
    inputSchema: {
      type: 'object',
      properties: {
        selector: {
          type: 'string'
        }
      },
      required: ['selector']
    }
  }, {
    name: 'count',
    description: 'element count',
    inputSchema: {
      type: 'object',
      properties: {
        selector: {
          type: 'string'
        }
      },
      required: ['selector']
    }
  }, {
    name: 'get_text',
    description: 'Get text (alias)',
    inputSchema: {
      type: 'object',
      properties: {
        selector: {
          type: 'string'
        },
        fallback: {
          type: 'string'
        }
      },
      required: ['selector']
    }
  }, {
    name: 'get_html',
    description: 'Get HTML (alias)',
    inputSchema: {
      type: 'object',
      properties: {
        selector: {
          type: 'string'
        },
        outer: {
          type: 'boolean'
        }
      },
      required: ['selector']
    }
  }, {
    name: 'get_attribute',
    description: 'Get attributes (alias)',
    inputSchema: {
      type: 'object',
      properties: {
        selector: {
          type: 'string'
        },
        attribute: {
          type: 'string'
        }
      },
      required: ['selector', 'attribute']
    }
  }, {
    name: 'get_url',
    description: 'Get URL (alias)',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  }, {
    name: 'get_title',
    description: 'Get title (alias)',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  }, {
    name: 'exists',
    description: 'Check for existence (alias)',
    inputSchema: {
      type: 'object',
      properties: {
        selector: {
          type: 'string'
        },
        timeout: {
          type: 'number'
        }
      },
      required: ['selector']
    }
  }, {
    name: 'is_visible',
    description: 'check visible (alias)',
    inputSchema: {
      type: 'object',
      properties: {
        selector: {
          type: 'string'
        }
      },
      required: ['selector']
    }
  }, {
    name: 'wait_for',
    description: 'Wait for element (alias)',
    inputSchema: {
      type: 'object',
      properties: {
        selector: {
          type: 'string'
        },
        state: {
          type: 'string'
        },
        timeout: {
          type: 'number'
        }
      },
      required: ['selector']
    }
  }, {
    name: 'wait_for_text',
    description: 'Wait for text (alias)',
    inputSchema: {
      type: 'object',
      properties: {
        text: {
          type: 'string'
        },
        timeout: {
          type: 'number'
        }
      },
      required: ['text']
    }
  }, {
    name: 'get_cookies',
    description: 'Get Cookies (alias)',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  }, {
    name: 'set_cookie',
    description: 'Set Cookie (alias)',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string'
        },
        value: {
          type: 'string'
        },
        domain: {
          type: 'string'
        }
      },
      required: ['name', 'value', 'domain']
    }
  }, {
    name: 'clear_cookies',
    description: 'Clear Cookies(alias)',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  }, {
    name: 'get_storage',
    description: 'Get Storage (alias)',
    inputSchema: {
      type: 'object',
      properties: {
        key: {
          type: 'string'
        },
        type: {
          type: 'string',
          enum: ['local', 'session']
        }
      }
    }
  }, {
    name: 'set_storage',
    description: 'Set Storage (alias)',
    inputSchema: {
      type: 'object',
      properties: {
        key: {
          type: 'string'
        },
        value: {
          type: 'string'
        },
        type: {
          type: 'string',
          enum: ['local', 'session']
        }
      },
      required: ['key']
    }
  }, {
    name: 'clear_storage',
    description: 'Clear Storage (alias)',
    inputSchema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['local', 'session']
        }
      }
    }
  }, {
    name: 'move_mouse',
    description: 'Move mouse (alias)',
    inputSchema: {
      type: 'object',
      properties: {
        x: {
          type: 'number'
        },
        y: {
          type: 'number'
        },
        steps: {
          type: 'number'
        }
      },
      required: ['x', 'y']
    }
  }, {
    name: 'mouse_down',
    description: 'Mouse press (alias)',
    inputSchema: {
      type: 'object',
      properties: {
        button: {
          type: 'string',
          enum: ['left', 'right', 'middle']
        }
      }
    }
  }, {
    name: 'mouse_up',
    description: 'mouse release (alias)',
    inputSchema: {
      type: 'object',
      properties: {
        button: {
          type: 'string',
          enum: ['left', 'right', 'middle']
        }
      }
    }
  }, {
    name: 'select_option',
    description: 'Select options (aliases)',
    inputSchema: {
      type: 'object',
      properties: {
        selector: {
          type: 'string'
        },
        value: {
          type: 'string'
        }
      },
      required: ['selector', 'value']
    }
  }, {
    name: 'set_checked',
    description: 'Set check (alias)',
    inputSchema: {
      type: 'object',
      properties: {
        selector: {
          type: 'string'
        },
        checked: {
          type: 'boolean'
        }
      },
      required: ['selector']
    }
  }, {
    name: 'toggle_checkbox',
    description: 'Toggle checkbox (alias)',
    inputSchema: {
      type: 'object',
      properties: {
        selector: {
          type: 'string'
        }
      },
      required: ['selector']
    }
  }];
  return cachedDescriptions;
}
let cachedSchemas = null;
function invocationSchema(weaveName) {
  if (!cachedSchemas) {
    cachedSchemas = new Map(actionDescriptions().map(weaveT => [weaveT.name, weaveT.inputSchema || null]));
  }
  return cachedSchemas.get(weaveName) || null;
}
module.exports = {
  actionDescriptions: actionDescriptions,
  invocationSchema: invocationSchema
};
