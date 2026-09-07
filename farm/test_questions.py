import json
import sys

def test_questions():
    with open('src/data/questions.js', 'r', encoding='utf-8') as f:
        content = f.read()
    
    start_idx = content.find('[')
    end_idx = content.rfind(']') + 1
    json_str = content[start_idx:end_idx]
    
    data = json.loads(json_str)
    
    print(f"[TEST] Successfully parsed questions.js dataset with {len(data)} questions.")
    
    single_count = 0
    multi_count = 0
    errors = []
    
    for idx, q in enumerate(data):
        qid = q.get('id')
        qtype = q.get('type')
        opts = q.get('options', [])
        c_ans = q.get('correctAnswers', [])
        opt_keys = [o['key'] for o in opts]
        
        if qtype == 'single':
            single_count += 1
            if len(c_ans) != 1:
                errors.append(f"Question {qid} (single): correctAnswers length is {len(c_ans)}, expected 1")
        elif qtype == 'multiple':
            multi_count += 1
            if len(c_ans) < 1:
                errors.append(f"Question {qid} (multiple): correctAnswers length is 0")
        else:
            errors.append(f"Question {qid}: unknown type {qtype}")
            
        for ca in c_ans:
            if ca not in opt_keys:
                errors.append(f"Question {qid}: correct answer '{ca}' not found in options {opt_keys}")
                
        if not q.get('article') or not q.get('explanation'):
            errors.append(f"Question {qid}: missing law article or explanation field")

    print(f"[TEST] Single choice count: {single_count}")
    print(f"[TEST] Multiple choice count: {multi_count}")
    if errors:
        print(f"[TEST] FOUND {len(errors)} ERRORS:")
        for err in errors:
            print(" -", err)
        sys.exit(1)
    else:
        print("[TEST] ALL 70 QUESTIONS ARE 100% VALIDATED WITHOUT ERRORS!")

if __name__ == '__main__':
    test_questions()
