
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35730/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function custom_event(type, detail, bubbles = false) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            while (flushidx < dirty_components.length) {
                const component = dirty_components[flushidx];
                flushidx++;
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    function bind(component, name, callback) {
        const index = component.$$.props[name];
        if (index !== undefined) {
            component.$$.bound[index] = callback;
            callback(component.$$.ctx[index]);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.46.4' }, detail), true));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev('SvelteDOMSetProperty', { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    function isLetter(character) {
      return /\p{L}/u.test(character)
    }

    /* src/GameText.svelte generated by Svelte v3.46.4 */
    const file$1 = "src/GameText.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[10] = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[13] = list[i];
    	return child_ctx;
    }

    // (59:8) {:else}
    function create_else_block(ctx) {
    	let div;
    	let t_value = /*character*/ ctx[13] + "";
    	let t;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(t_value);
    			attr_dev(div, "class", "punctuation svelte-1v061a3");
    			add_location(div, file$1, 59, 10, 1457);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*text*/ 4 && t_value !== (t_value = /*character*/ ctx[13] + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(59:8) {:else}",
    		ctx
    	});

    	return block;
    }

    // (47:8) {#if isLetter(character)}
    function create_if_block$1(ctx) {
    	let div;
    	let button;
    	let t0_value = /*key*/ ctx[3][/*character*/ ctx[13]] + "";
    	let t0;
    	let t1;
    	let input;
    	let input_value_value;
    	let div_class_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			button = element("button");
    			t0 = text(t0_value);
    			t1 = space();
    			input = element("input");
    			attr_dev(button, "class", "svelte-1v061a3");
    			add_location(button, file$1, 48, 12, 1102);
    			attr_dev(input, "type", "text");
    			attr_dev(input, "maxlength", "1");
    			input.disabled = "true";
    			input.value = input_value_value = /*guessedLetters*/ ctx[1][/*key*/ ctx[3][/*character*/ ctx[13]]] || '';
    			attr_dev(input, "class", "svelte-1v061a3");
    			add_location(input, file$1, 49, 12, 1175);

    			attr_dev(div, "class", div_class_value = "letter" + (/*key*/ ctx[3][/*character*/ ctx[13]] === /*activeLetter*/ ctx[0]
    			? ' active'
    			: '') + " svelte-1v061a3");

    			add_location(div, file$1, 47, 10, 1019);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, button);
    			append_dev(button, t0);
    			append_dev(div, t1);
    			append_dev(div, input);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button, "click", /*highlightLetter*/ ctx[5], false, false, false),
    					listen_dev(input, "blur", /*guessAdded*/ ctx[6], false, false, false),
    					listen_dev(input, "keyup", checkForEnter, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*key, text*/ 12 && t0_value !== (t0_value = /*key*/ ctx[3][/*character*/ ctx[13]] + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*guessedLetters, key, text*/ 14 && input_value_value !== (input_value_value = /*guessedLetters*/ ctx[1][/*key*/ ctx[3][/*character*/ ctx[13]]] || '') && input.value !== input_value_value) {
    				prop_dev(input, "value", input_value_value);
    			}

    			if (dirty & /*key, text, activeLetter*/ 13 && div_class_value !== (div_class_value = "letter" + (/*key*/ ctx[3][/*character*/ ctx[13]] === /*activeLetter*/ ctx[0]
    			? ' active'
    			: '') + " svelte-1v061a3")) {
    				attr_dev(div, "class", div_class_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(47:8) {#if isLetter(character)}",
    		ctx
    	});

    	return block;
    }

    // (46:6) {#each word as character}
    function create_each_block_1(ctx) {
    	let show_if;
    	let if_block_anchor;

    	function select_block_type(ctx, dirty) {
    		if (dirty & /*text*/ 4) show_if = null;
    		if (show_if == null) show_if = !!isLetter(/*character*/ ctx[13]);
    		if (show_if) return create_if_block$1;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type(ctx, -1);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type(ctx, dirty)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},
    		d: function destroy(detaching) {
    			if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(46:6) {#each word as character}",
    		ctx
    	});

    	return block;
    }

    // (44:2) {#each text as word}
    function create_each_block(ctx) {
    	let div;
    	let t;
    	let each_value_1 = /*word*/ ctx[10];
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t = space();
    			attr_dev(div, "class", "word svelte-1v061a3");
    			add_location(div, file$1, 44, 4, 924);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			append_dev(div, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*key, text, activeLetter, guessedLetters, guessAdded, checkForEnter, highlightLetter, isLetter*/ 111) {
    				each_value_1 = /*word*/ ctx[10];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, t);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(44:2) {#each text as word}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let div;
    	let each_value = /*text*/ ctx[2];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "class", "text svelte-1v061a3");
    			add_location(div, file$1, 42, 0, 863);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			/*div_binding*/ ctx[8](div);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*text, key, activeLetter, guessedLetters, guessAdded, checkForEnter, highlightLetter, isLetter*/ 111) {
    				each_value = /*text*/ ctx[2];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    			/*div_binding*/ ctx[8](null);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function checkForEnter(typeEvent) {
    	if (typeEvent.key === "Enter") {
    		typeEvent.target.blur();
    	}
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('GameText', slots, []);
    	let { text } = $$props;
    	let { key } = $$props;
    	let { value } = $$props;
    	let { activeLetter } = $$props;
    	let { guessedLetters } = $$props;
    	let el;

    	function highlightLetter({ target }) {
    		$$invalidate(0, activeLetter = target.textContent);
    		target.nextElementSibling.disabled = false;
    		target.nextElementSibling.focus();
    	}

    	function guessAdded({ target }) {
    		$$invalidate(1, guessedLetters[activeLetter] = target.value, guessedLetters);
    		target.disabled = true;
    		$$invalidate(0, activeLetter = null);
    		window.setTimeout(updateValue, 0);
    	}

    	function updateValue() {
    		const allInputs = Array.from(el.querySelectorAll('input'));

    		$$invalidate(7, value = allInputs.reduce(
    			(accumulator, input) => {
    				return accumulator + input.value;
    			},
    			''
    		));
    	}

    	const writable_props = ['text', 'key', 'value', 'activeLetter', 'guessedLetters'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<GameText> was created with unknown prop '${key}'`);
    	});

    	function div_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			el = $$value;
    			$$invalidate(4, el);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ('text' in $$props) $$invalidate(2, text = $$props.text);
    		if ('key' in $$props) $$invalidate(3, key = $$props.key);
    		if ('value' in $$props) $$invalidate(7, value = $$props.value);
    		if ('activeLetter' in $$props) $$invalidate(0, activeLetter = $$props.activeLetter);
    		if ('guessedLetters' in $$props) $$invalidate(1, guessedLetters = $$props.guessedLetters);
    	};

    	$$self.$capture_state = () => ({
    		isLetter,
    		text,
    		key,
    		value,
    		activeLetter,
    		guessedLetters,
    		el,
    		highlightLetter,
    		guessAdded,
    		checkForEnter,
    		updateValue
    	});

    	$$self.$inject_state = $$props => {
    		if ('text' in $$props) $$invalidate(2, text = $$props.text);
    		if ('key' in $$props) $$invalidate(3, key = $$props.key);
    		if ('value' in $$props) $$invalidate(7, value = $$props.value);
    		if ('activeLetter' in $$props) $$invalidate(0, activeLetter = $$props.activeLetter);
    		if ('guessedLetters' in $$props) $$invalidate(1, guessedLetters = $$props.guessedLetters);
    		if ('el' in $$props) $$invalidate(4, el = $$props.el);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		activeLetter,
    		guessedLetters,
    		text,
    		key,
    		el,
    		highlightLetter,
    		guessAdded,
    		value,
    		div_binding
    	];
    }

    class GameText extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {
    			text: 2,
    			key: 3,
    			value: 7,
    			activeLetter: 0,
    			guessedLetters: 1
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "GameText",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*text*/ ctx[2] === undefined && !('text' in props)) {
    			console.warn("<GameText> was created without expected prop 'text'");
    		}

    		if (/*key*/ ctx[3] === undefined && !('key' in props)) {
    			console.warn("<GameText> was created without expected prop 'key'");
    		}

    		if (/*value*/ ctx[7] === undefined && !('value' in props)) {
    			console.warn("<GameText> was created without expected prop 'value'");
    		}

    		if (/*activeLetter*/ ctx[0] === undefined && !('activeLetter' in props)) {
    			console.warn("<GameText> was created without expected prop 'activeLetter'");
    		}

    		if (/*guessedLetters*/ ctx[1] === undefined && !('guessedLetters' in props)) {
    			console.warn("<GameText> was created without expected prop 'guessedLetters'");
    		}
    	}

    	get text() {
    		throw new Error("<GameText>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set text(value) {
    		throw new Error("<GameText>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get key() {
    		throw new Error("<GameText>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set key(value) {
    		throw new Error("<GameText>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get value() {
    		throw new Error("<GameText>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<GameText>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get activeLetter() {
    		throw new Error("<GameText>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set activeLetter(value) {
    		throw new Error("<GameText>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get guessedLetters() {
    		throw new Error("<GameText>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set guessedLetters(value) {
    		throw new Error("<GameText>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split('');

    function validate(key) {
      const correctLetters = ALPHABET.filter((letter) => {
        return key[letter] === letter;
      });

      return !Boolean(correctLetters.length);
    }

    function generateKey() {
      const letters = ALPHABET.slice();

      // Fisher-Yates shuffle:
      // https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle
      for (let i=0; i<26; i++) {
        const j = Math.floor(Math.random() * 26);

        const temp = letters[i];
        letters[i] = letters[j];
        letters[j] = temp;
      }

      const key = ALPHABET.reduce((accumulator, letter) => {
        accumulator[letter] = letters.pop();
        return accumulator;
      }, {});

      if (validate(key)) {
        return key;
      } else {
        return generateKey();
      }
    }

    /* src/App.svelte generated by Svelte v3.46.4 */
    const file = "src/App.svelte";

    // (69:2) {#if (gameOver)}
    function create_if_block(ctx) {
    	let div;
    	let p0;
    	let t1;
    	let p1;

    	const block = {
    		c: function create() {
    			div = element("div");
    			p0 = element("p");
    			p0.textContent = `${/*text*/ ctx[8]}`;
    			t1 = space();
    			p1 = element("p");
    			p1.textContent = ` - ${/*author*/ ctx[7]}`;
    			add_location(p0, file, 70, 6, 1729);
    			add_location(p1, file, 71, 6, 1749);
    			attr_dev(div, "class", "winMessage invisible svelte-7khn8o");
    			add_location(div, file, 69, 4, 1665);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, p0);
    			append_dev(div, t1);
    			append_dev(div, p1);
    			/*div_binding_1*/ ctx[20](div);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			/*div_binding_1*/ ctx[20](null);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(69:2) {#if (gameOver)}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let main;
    	let div;
    	let gametext0;
    	let updating_value;
    	let updating_activeLetter;
    	let updating_guessedLetters;
    	let t0;
    	let gametext1;
    	let updating_value_1;
    	let updating_activeLetter_1;
    	let updating_guessedLetters_1;
    	let t1;
    	let current;

    	function gametext0_value_binding(value) {
    		/*gametext0_value_binding*/ ctx[13](value);
    	}

    	function gametext0_activeLetter_binding(value) {
    		/*gametext0_activeLetter_binding*/ ctx[14](value);
    	}

    	function gametext0_guessedLetters_binding(value) {
    		/*gametext0_guessedLetters_binding*/ ctx[15](value);
    	}

    	let gametext0_props = {
    		key: /*key*/ ctx[9],
    		text: /*words*/ ctx[10]
    	};

    	if (/*wordsValue*/ ctx[0] !== void 0) {
    		gametext0_props.value = /*wordsValue*/ ctx[0];
    	}

    	if (/*activeLetter*/ ctx[2] !== void 0) {
    		gametext0_props.activeLetter = /*activeLetter*/ ctx[2];
    	}

    	if (/*guessedLetters*/ ctx[3] !== void 0) {
    		gametext0_props.guessedLetters = /*guessedLetters*/ ctx[3];
    	}

    	gametext0 = new GameText({ props: gametext0_props, $$inline: true });
    	binding_callbacks.push(() => bind(gametext0, 'value', gametext0_value_binding));
    	binding_callbacks.push(() => bind(gametext0, 'activeLetter', gametext0_activeLetter_binding));
    	binding_callbacks.push(() => bind(gametext0, 'guessedLetters', gametext0_guessedLetters_binding));

    	function gametext1_value_binding(value) {
    		/*gametext1_value_binding*/ ctx[16](value);
    	}

    	function gametext1_activeLetter_binding(value) {
    		/*gametext1_activeLetter_binding*/ ctx[17](value);
    	}

    	function gametext1_guessedLetters_binding(value) {
    		/*gametext1_guessedLetters_binding*/ ctx[18](value);
    	}

    	let gametext1_props = {
    		key: /*key*/ ctx[9],
    		text: /*names*/ ctx[11]
    	};

    	if (/*authorValue*/ ctx[1] !== void 0) {
    		gametext1_props.value = /*authorValue*/ ctx[1];
    	}

    	if (/*activeLetter*/ ctx[2] !== void 0) {
    		gametext1_props.activeLetter = /*activeLetter*/ ctx[2];
    	}

    	if (/*guessedLetters*/ ctx[3] !== void 0) {
    		gametext1_props.guessedLetters = /*guessedLetters*/ ctx[3];
    	}

    	gametext1 = new GameText({ props: gametext1_props, $$inline: true });
    	binding_callbacks.push(() => bind(gametext1, 'value', gametext1_value_binding));
    	binding_callbacks.push(() => bind(gametext1, 'activeLetter', gametext1_activeLetter_binding));
    	binding_callbacks.push(() => bind(gametext1, 'guessedLetters', gametext1_guessedLetters_binding));
    	let if_block = /*gameOver*/ ctx[4] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			main = element("main");
    			div = element("div");
    			create_component(gametext0.$$.fragment);
    			t0 = space();
    			create_component(gametext1.$$.fragment);
    			t1 = space();
    			if (if_block) if_block.c();
    			attr_dev(div, "class", "game svelte-7khn8o");
    			add_location(div, file, 52, 2, 1259);
    			attr_dev(main, "class", "svelte-7khn8o");
    			add_location(main, file, 51, 0, 1250);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, div);
    			mount_component(gametext0, div, null);
    			append_dev(div, t0);
    			mount_component(gametext1, div, null);
    			/*div_binding*/ ctx[19](div);
    			append_dev(main, t1);
    			if (if_block) if_block.m(main, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const gametext0_changes = {};

    			if (!updating_value && dirty & /*wordsValue*/ 1) {
    				updating_value = true;
    				gametext0_changes.value = /*wordsValue*/ ctx[0];
    				add_flush_callback(() => updating_value = false);
    			}

    			if (!updating_activeLetter && dirty & /*activeLetter*/ 4) {
    				updating_activeLetter = true;
    				gametext0_changes.activeLetter = /*activeLetter*/ ctx[2];
    				add_flush_callback(() => updating_activeLetter = false);
    			}

    			if (!updating_guessedLetters && dirty & /*guessedLetters*/ 8) {
    				updating_guessedLetters = true;
    				gametext0_changes.guessedLetters = /*guessedLetters*/ ctx[3];
    				add_flush_callback(() => updating_guessedLetters = false);
    			}

    			gametext0.$set(gametext0_changes);
    			const gametext1_changes = {};

    			if (!updating_value_1 && dirty & /*authorValue*/ 2) {
    				updating_value_1 = true;
    				gametext1_changes.value = /*authorValue*/ ctx[1];
    				add_flush_callback(() => updating_value_1 = false);
    			}

    			if (!updating_activeLetter_1 && dirty & /*activeLetter*/ 4) {
    				updating_activeLetter_1 = true;
    				gametext1_changes.activeLetter = /*activeLetter*/ ctx[2];
    				add_flush_callback(() => updating_activeLetter_1 = false);
    			}

    			if (!updating_guessedLetters_1 && dirty & /*guessedLetters*/ 8) {
    				updating_guessedLetters_1 = true;
    				gametext1_changes.guessedLetters = /*guessedLetters*/ ctx[3];
    				add_flush_callback(() => updating_guessedLetters_1 = false);
    			}

    			gametext1.$set(gametext1_changes);

    			if (/*gameOver*/ ctx[4]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					if_block.m(main, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(gametext0.$$.fragment, local);
    			transition_in(gametext1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(gametext0.$$.fragment, local);
    			transition_out(gametext1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(gametext0);
    			destroy_component(gametext1);
    			/*div_binding*/ ctx[19](null);
    			if (if_block) if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function parseIntoWordsAndLetters(string) {
    	const words = string.toUpperCase().split(' ');
    	const wordsAndLetters = words.map(word => word.split(''));
    	return wordsAndLetters;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	let { quote } = $$props;
    	let activeLetter = null;
    	let guessedLetters = {};
    	let wordsValue = '';
    	let authorValue = '';
    	let gameOver = false;
    	let gameOverEl;
    	let gameBoardEl;
    	const { author, text } = quote;
    	const key = generateKey();
    	const words = parseIntoWordsAndLetters(text);
    	const names = parseIntoWordsAndLetters(author);

    	function formatGuess(guess) {
    		return guess.flat().filter(char => isLetter(char)).join('');
    	}

    	function checkForWin(wordGuess, authorGuess) {
    		const answer = formatGuess(words || []) + formatGuess(names || []);
    		const guess = wordGuess.toUpperCase() + authorGuess.toUpperCase();

    		if (guess === answer) {
    			$$invalidate(4, gameOver = true);
    			gameBoardEl.classList.add('invisible');

    			window.setTimeout(
    				() => {
    					gameOverEl.classList.remove('invisible');
    				},
    				500
    			);
    		}
    	}

    	const writable_props = ['quote'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	function gametext0_value_binding(value) {
    		wordsValue = value;
    		$$invalidate(0, wordsValue);
    	}

    	function gametext0_activeLetter_binding(value) {
    		activeLetter = value;
    		$$invalidate(2, activeLetter);
    	}

    	function gametext0_guessedLetters_binding(value) {
    		guessedLetters = value;
    		$$invalidate(3, guessedLetters);
    	}

    	function gametext1_value_binding(value) {
    		authorValue = value;
    		$$invalidate(1, authorValue);
    	}

    	function gametext1_activeLetter_binding(value) {
    		activeLetter = value;
    		$$invalidate(2, activeLetter);
    	}

    	function gametext1_guessedLetters_binding(value) {
    		guessedLetters = value;
    		$$invalidate(3, guessedLetters);
    	}

    	function div_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			gameBoardEl = $$value;
    			$$invalidate(6, gameBoardEl);
    		});
    	}

    	function div_binding_1($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			gameOverEl = $$value;
    			$$invalidate(5, gameOverEl);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ('quote' in $$props) $$invalidate(12, quote = $$props.quote);
    	};

    	$$self.$capture_state = () => ({
    		GameText,
    		isLetter,
    		generateKey,
    		quote,
    		activeLetter,
    		guessedLetters,
    		wordsValue,
    		authorValue,
    		gameOver,
    		gameOverEl,
    		gameBoardEl,
    		author,
    		text,
    		key,
    		words,
    		names,
    		parseIntoWordsAndLetters,
    		formatGuess,
    		checkForWin
    	});

    	$$self.$inject_state = $$props => {
    		if ('quote' in $$props) $$invalidate(12, quote = $$props.quote);
    		if ('activeLetter' in $$props) $$invalidate(2, activeLetter = $$props.activeLetter);
    		if ('guessedLetters' in $$props) $$invalidate(3, guessedLetters = $$props.guessedLetters);
    		if ('wordsValue' in $$props) $$invalidate(0, wordsValue = $$props.wordsValue);
    		if ('authorValue' in $$props) $$invalidate(1, authorValue = $$props.authorValue);
    		if ('gameOver' in $$props) $$invalidate(4, gameOver = $$props.gameOver);
    		if ('gameOverEl' in $$props) $$invalidate(5, gameOverEl = $$props.gameOverEl);
    		if ('gameBoardEl' in $$props) $$invalidate(6, gameBoardEl = $$props.gameBoardEl);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*wordsValue, authorValue*/ 3) {
    			checkForWin(wordsValue, authorValue);
    		}
    	};

    	return [
    		wordsValue,
    		authorValue,
    		activeLetter,
    		guessedLetters,
    		gameOver,
    		gameOverEl,
    		gameBoardEl,
    		author,
    		text,
    		key,
    		words,
    		names,
    		quote,
    		gametext0_value_binding,
    		gametext0_activeLetter_binding,
    		gametext0_guessedLetters_binding,
    		gametext1_value_binding,
    		gametext1_activeLetter_binding,
    		gametext1_guessedLetters_binding,
    		div_binding,
    		div_binding_1
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { quote: 12 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*quote*/ ctx[12] === undefined && !('quote' in props)) {
    			console.warn("<App> was created without expected prop 'quote'");
    		}
    	}

    	get quote() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set quote(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var quotes = [
      {
        text: "Any fool can write code that a computer can understand. Good programmers write code that humans can understand.",
        author: "Martin Fowler"
      },{
        text: "The most damaging phrase in the language is... it's always been done this way.",
        author: "Grace Hopper"
      },{
        text: "Perfection is achieved not when there is nothing more to add, but rather when there is nothing more to take away.",
        author: "Antoine de Saint-Exupery"
      },{
        text: "When you don't create things, you become defined by your tastes rather than ability. Your tastes only narrow & exclude people. So create.",
        author: "Why The Lucky Stiff" // I know it's _why, but that would give the name away too easily :p
      },{
        text: "Always code as if the guy who ends up maintaining your code will be a violent psychopath who knows where you live.",
        author: "John Woods"
      },{
        text: "Give a man a program, frustrate him for a day. Teach a man to program, frustrate him for a lifetime.",
        author: "Muhammad Waseem"
      },{
        text: "Everyone knows that debugging is twice as hard as writing a program in the first place. So if you're as clever as you can be when you write it, how will you ever debug it?",
        author: "Brian Kernighan"
      },{
        text: "What kind of programmer is so divorced from reality that she thinks she'll get complex software right the first time?",
        author: "James Alan Gardner"
      },{
        text: "Any organisation that designs a system will produce a design whose structure is a copy of the organisation's communication structure.",
        author: "Robert C. Martin"
      },{
        text: "No matter which field of work you want to go in, it is of great importance to learn at least one programming language.",
        author: "Ram Ray"
      },{
        text: "The realization came over me with full force that a good part of the remainder of my life was going to be spent in finding errors in my own programs.",
        author: "Maurice Wilkes"
      },{
        text: "When it comes to writing code, the number one most important skill is how to keep a tangle of features from collapsing under the weight of its own complexity.",
        author: "James Hague"
      },{
        text: "Every program attempts to expand until it can read mail. Those programs which cannot so expand are replaced by ones which can.",
        author: "Jamie Zawinski"
      },{
        text: "The personal computer isn't personal because it's small and portable and yours to own. It's personal because you pour yourself into it.", // Mildly adjusted to format more easily.
        author: "Audrey Watters"
      },{
        text: "You should imagine variables as tentacles, rather than boxes. They do not contain values; they grasp them—two variables can refer to the same value.",
        author: "Marijn Haverbeke"
      },{
        text: "Learning the art of programming, like most other disciplines, consists of first learning the rules and then learning when to break them.",
        author: "Joshua Bloch"
      },{
        text: "We need to understand that if we all work on inclusion together, it’s going to be faster, broader, better, and more thorough than anything we can do on our own.”",
        author: "Ellen Pao"
      },{
        text: "Most of the good programmers do programming not because they expect to get paid or get adulation by the public, but because it is fun to program.",
        author: "Linus Torvalds"
      },{
        text: "Everybody should learn to program a computer, because it teaches you how to think.",
        author: "Steve Jobs"
      },{
        text: "Sometimes it pays to stay in bed on Monday, rather than spending the rest of the week debugging Monday’s code.",
        author: "Dan Salomon"
      },{
        text: "Coding is today's language of creativity. All our children deserve a chance to become creators instead of consumers of computer science.",
        author: "Maria Klawe"
      },{
        text: "A computer once beat me at chess, but it was no match for me at kick boxing.",
        author: "Emo Philips"
      },{
        text: "Computer Science is no more about computers than astronomy is about telescopes.",
        author: "Edsger Dijkstra"
      },{
        text: "The greatest enemy of knowledge is not ignorance, it is the illusion of knowledge.",
        author: "Stephen Hawking"
      },{
        text: "We have to stop optimizing for programmers and start optimizing for users.",
        author: "Jeff Atwood"
      },{
        text: "The difference between theory and practice is that in theory, there is no difference between theory and practice.",
        author: "Richard Moore"
      },{
        text: "If you think technology can solve your security problems, then you don’t understand the problems and you don’t understand the technology.",
        author: "Bruce Schneier"
      },{
        text: "Passwords are like underwear: you don’t let people see it, you should change it very often, and you shouldn’t share it with strangers.",
        author: "Chris Pirillo"
      },{
        text: "The greatest risk we face in software development is that of overestimating our own knowledge.",
        author: "Jim Highsmith"
      },{
        text: "The significant problems we face cannot be solved by the same level of thinking that created them.",
        author: "Albert Einstein"
      }
    ];

    const randomIndex = Math.floor(Math.random() * quotes.length);

    const app = new App({
      target: document.body,
      props: {
        quote: quotes[randomIndex]
      }
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
