import re

path = r'D:\__G AG Projects\vsecretnote_hkC_20260815\vboard\app\src\main\java\vn\ehou\vsecretkeyboard\SwipeKeyboardView.kt'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add CommitRhymeTutor
if 'data class CommitRhymeTutor' not in content:
    content = content.replace('object OpenGuideLayer : KeyboardAction()', 'object OpenGuideLayer : KeyboardAction()\n        data class CommitRhymeTutor(val replacementText: String, val prefixLength: Int) : KeyboardAction()')

# 2. Fix the flick handler (capitalization and fallback to CommitRhymeTutor)
old_flick_block = '''                        // 1. Ưu tiên hoàn tất từ bằng Rhyme Tutor
                        if (tutorMatchedRhyme != null && rhymeTutorPrefix.isNotEmpty()) {
                            val engineDir = activeEngineDir ?: FlickCompassEngine.getDirectionFromDelta(dx, dy, 18f)
                            val tone = when (engineDir) {
                                FlickDirection.SAC -> 1
                                FlickDirection.HUYEN -> 2
                                FlickDirection.HOI -> 3
                                FlickDirection.NGA -> 4
                                FlickDirection.NANG -> 5
                                FlickDirection.BANG -> 0
                                else -> 0
                            }
                            val tonedRhyme = RhymeTutorEngine.applyTone(tutorMatchedRhyme, tone)
                            performHapticFeedback(HapticFeedbackConstants.KEYBOARD_TAP)
                            val pLen = rhymeTutorPrefix.length
                            clearRhymeTutor()
                            onAction?.invoke(KeyboardAction.CommitRhymeTutor(tonedRhyme, pLen))
                            if (isShiftActive && !isCapsLock) {
                                isShiftActive = false
                                calculateKeys(width, height)
                            }
                            invalidate()
                            return true
                        }

                        if (model?.chipDef != null && activeEngineDir != null) {
                            val value = FlickCompassEngine.getValueForDirection(
                                model.chipDef!!,
                                activeEngineDir,
                                isShiftActive || isCapsLock
                            )
                            if (value.isNotEmpty()) {
                                performHapticFeedback(HapticFeedbackConstants.KEYBOARD_TAP)
                                onAction?.invoke(KeyboardAction.CommitText(value))'''

new_flick_block = '''                        // 1. Ưu tiên hoàn tất từ bằng Rhyme Tutor
                        if (tutorMatchedRhyme != null && rhymeTutorPrefix.isNotEmpty()) {
                            val engineDir = activeEngineDir ?: FlickCompassEngine.getDirectionFromDelta(dx, dy, 18f)
                            val tone = when (engineDir) {
                                FlickDirection.SAC -> 1
                                FlickDirection.HUYEN -> 2
                                FlickDirection.HOI -> 3
                                FlickDirection.NGA -> 4
                                FlickDirection.NANG -> 5
                                FlickDirection.BANG -> 0
                                else -> 0
                            }
                            val tonedRhyme = RhymeTutorEngine.applyTone(tutorMatchedRhyme, tone)
                            val isCapitalized = rhymeTutorPrefix.firstOrNull()?.isUpperCase() == true
                            val finalRhyme = if (isCapitalized) tonedRhyme.replaceFirstChar { it.uppercase() } else tonedRhyme
                            performHapticFeedback(HapticFeedbackConstants.KEYBOARD_TAP)
                            val pLen = rhymeTutorPrefix.length
                            clearRhymeTutor()
                            onAction?.invoke(KeyboardAction.CommitRhymeTutor(finalRhyme, pLen))
                            if (isShiftActive && !isCapsLock) {
                                isShiftActive = false
                                calculateKeys(width, height)
                            }
                            invalidate()
                            return true
                        }

                        if (model?.chipDef != null && activeEngineDir != null) {
                            val value = FlickCompassEngine.getValueForDirection(
                                model.chipDef!!,
                                activeEngineDir,
                                isShiftActive || isCapsLock
                            )
                            if (value.isNotEmpty()) {
                                performHapticFeedback(HapticFeedbackConstants.KEYBOARD_TAP)
                                // Sửa lỗi: Mọi cú vuốt phím la bàn đều hoàn tất từ (tạo khoảng trắng)
                                onAction?.invoke(KeyboardAction.CommitRhymeTutor(value, 0))'''

if old_flick_block in content:
    content = content.replace(old_flick_block, new_flick_block)
else:
    print("Could not find old flick block")

# 3. Fix handleFlickAction to use CommitRhymeTutor with pLen = 0
content = content.replace('onAction?.invoke(KeyboardAction.CommitText(baseCluster))', 'onAction?.invoke(KeyboardAction.CommitRhymeTutor(baseCluster, 0))')
content = content.replace('onAction?.invoke(KeyboardAction.CommitText(chosen))', 'onAction?.invoke(KeyboardAction.CommitRhymeTutor(chosen, 0))')
content = content.replace('onAction?.invoke(KeyboardAction.CommitText(baseVowel))', 'onAction?.invoke(KeyboardAction.CommitRhymeTutor(baseVowel, 0))')

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated SwipeKeyboardView.kt")
